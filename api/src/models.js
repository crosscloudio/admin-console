import DataLoader from 'dataloader';
import base32 from 'base32';
import { difference, flatten, map, pick, uniq } from 'lodash';
import uuidValidate from 'uuid-validate';
import uuidv4 from 'uuid/v4';

import { StatsHelper } from './stats/models';
import StorageTypes from './constants/StorageTypes';
import UserError from './utils/UserError';
import { checkPassword, hashPassword } from './utils/passwords';
import { createEmailHelper } from './email/models';
import { getAdminAutoLoginUrl } from './utils/tokens';
import {
  itemsByValueLoader,
  loadConnection,
  relatedItemsLoader,
} from './utils/loaderUtils';
import { validateContactData, validatePolicy } from './utils/validators';

// snake_case is used for compatibility with database
/* eslint-disable camelcase */

const ADMINISTRATOR_ROLE = 'administrator';
const PEM_PUBLIC_KEY_RE = /^-+BEGIN PUBLIC KEY-+(\n|\r\n)(.|\n|\r\n)*(\n|\r\n)-+END PUBLIC KEY-+$/;

/**
 * An error class used in the fake admin helper
 */
class AdminRightsRequiredError extends UserError {
  constructor() {
    super('Administrator rights required to perform this action');
  }
}

/**
 * A helper class which integrates knex.js and DataLoader and provides
 * standard CRUD operations. It implements the Data Access Object (DAO)
 * pattern. It's an abstract base class - a subclass should
 * be defined for each database table and should override at least
 * `tableName` getter.
 */
class Model {
  /**
   * A constructor requires an object with a `knex` as a key - it should
   * be an instance of knex.js object.
   */
  constructor(props) {
    // there could be an additional props (e.g. instances of related DAOs)
    this.props = props;
    this.knex = props.knex;
    // byId is an instance of DataLoader - https://github.com/facebook/dataloader
    // Warning: don't try to use `this.getTable()` here - it seems
    // to be cached and generates incorrect SQL queries
    this.byId = itemsByValueLoader(this.knex, this.tableName, 'id');
  }

  /**
   * Insert data as a row into the database
   * @param {Object} data - data to save
   * @returns {Promise<Object>} saved data (with `id` property)
   */
  async create(data) {
    const result = await this.getTable().insert(data).returning('*');
    return result[0];
  }

  /**
   * Updates an entity if it already exists or creates one otherwise
   * @param {Object} defaults - values used to find an already existing instance
   * @param {Object} rest - values to update
   * @returns {Promise<Object>} - the updated or newly created entity
   */
  async updateOrCreate(defaults, rest) {
    const instance = await this.getTable().where(defaults).first();
    if (instance) {
      return this.updateWhere(defaults, rest);
    }
    return this.create({
      ...defaults,
      ...rest,
    });
  }

  /**
   * Get data from the database by id
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async get(id, { useCache } = {}) {
    if (useCache === false) {
      this.byId.clear(id);
    }
    const item = await this.byId.load(id);
    // check additional validation rules for the item (e.g. models might ignore
    // items with a `deleted` flag)
    if (item && !this.validateItem(item)) {
      return null;
    }
    return item;
  }

  /**
   * Update a row in the database filtered by id
   * @param {number|string} id - id of the row to update
   * @param {Object} data - fields to update
   * @returns {Promise<Object>} updated row
   */
  async update(id, data) {
    const result = await this.getTable()
      .where({ id })
      .update({
        ...data,
        // update `updated_at` field to the current date
        updated_at: new Date(),
      })
      .returning('*');
    const updatedInstance = result[0];
    // replace a cached instance with the updated one
    this.byId.prime(id, updatedInstance);
    return updatedInstance;
  }

  /**
   * Update a row (or rows) in the database filtered by conditions.
   * It is designed for situations where additional security is required
   * (e.g. filtering by id is not enough - we also have to check if the row
   * has correct `organization_id`).
   * @param {Object} conditions - filtering conditions (converted to SQL
   * WHERE clause)
   * @param {Object} data - fields to update
   * @returns {Promise<Object>} the first updated row
   */
  async updateWhere(conditions, data) {
    const result = await this.getTable()
      .where(conditions)
      .update({
        ...data,
        // update `updated_at` field to the current date
        updated_at: new Date(),
      })
      .returning('*');
    const updatedInstance = result[0];
    // clear cache - all instanced because we don't have a key in the function
    // arguments
    this.byId.clearAll();
    return updatedInstance;
  }

  /**
   * Delete a row (or rows) in the database filtered by conditions.
   * @param {Object} conditions - filtering conditions (converted to SQL
   * WHERE clause)
   * @returns {Promise<number>} - the count of deleted items
   */
  async deleteWhere(conditions) {
    const deletedCount = await this.getTable().where(conditions).delete();
    // clear cache - all instanced because we don't have a key in the function
    // arguments
    this.byId.clearAll();
    return deletedCount;
  }

  /**
   * @protected
   * Get an instance of the knex query builder for the model's table.
   * Warning: Don't use it for situations where the returned instance
   * could be used more than once (e.g. in dataloaders) - incorrect
   * SQL queries are generated in that case
   */
  getTable() {
    return this.knex(this.tableName);
  }

  /**
   * @protected
   * Check if the item from the database is valid (e.g. if it didn't have
   * a `deleted` status)
   * @param {Object} item - item to validate
   */
  // eslint-disable-next-line no-unused-vars
  validateItem(item) {
    return true;
  }

  /**
   * @abstract
   * Return a name of the database table for this model class
   */
  get tableName() {
    throw new Error('Please implement `get tableName()` in a child class');
  }
}

/**
 * Activity logs DAO
 */
class ActivityLogs extends Model {
  get tableName() {
    return 'activity_logs';
  }
}

/**
 * Approval requests DAO
 * It has an additional data loader:
 * - `forUser` which allows to load all approval requests by user id.
 */
class ApprovalRequests extends Model {
  get tableName() {
    return 'approval_requests';
  }

  constructor(...args) {
    super(...args);

    this.forUser = relatedItemsLoader(
      this.knex,
      this.tableName,
      'user_id',
      'device_id'
    );
  }
}

/**
 * A cloud storage providers DAO. It has additional data loaders:
 * - `forUser` which allows to load all csps by user id.
 * - `byTypeAndUniqueId` finds all CSPS by a pair of [type, unique_id] values.
 */
export class CloudStorageProviders extends Model {
  constructor(...args) {
    super(...args);

    this.forUser = relatedItemsLoader(
      this.knex,
      this.tableName,
      'user_id',
      'unique_id'
    );

    this.byTypeAndUniqueId = new DataLoader(
      async keys => {
        let query = this.knex(this.tableName);
        keys.forEach(([type, unique_id]) => {
          query = query.orWhere({ type, unique_id });
        });
        const result = await query;
        return keys.map(([type, unique_id]) =>
          // NOTE: it's possible that there are two or more CSP entities
          // with the same type and unique_id (if many users share the same
          // account)
          result.filter(csp => csp.type === type && csp.unique_id === unique_id)
        );
      },
      // stringify keys to make arrays of the same values equivalent
      { cacheKeyFn: key => JSON.stringify(key) }
    );
  }

  get tableName() {
    return 'cloud_storages';
  }

  /**
   * Delete CSP for a user
   * @param {number|string} userId
   * @param {string} cspId
   * @returns {Promise}
   */
  deleteByUserAndCspId(userId, cspId) {
    return this.deleteWhere({
      user_id: userId,
      csp_id: cspId,
    });
  }

  /**
   * Update authentication_data for a cloud storage provider
   * @param {Object} data - an object with the following fields:
   *  - user_id - id of the owner of the CSP
   *  - csp_id - client side csp id
   *  - old_authentication_data - the current value of the authentication_data
   *    (used as a locking mechanism - should have the same value as the current
   *    value of `authentication_data` in the database, otherwise an error
   *    is thrown)
   * @returns {Promise<Object>} - the updated cloud storage provider
   */
  updateCspAuthData({
    user_id,
    csp_id,
    old_authentication_data,
    new_authentication_data,
  }) {
    // run everything in a transaction
    return this.knex.transaction(async trx => {
      // fetch the csp with `FOR UPDATE` modifier
      const csp = await this.getTable()
        .where({
          user_id,
          csp_id,
        })
        .transacting(trx)
        .forUpdate()
        .first();
      if (!csp) {
        throw new UserError('Cannot find cloud storage provider');
      }
      if (csp.authentication_data !== old_authentication_data) {
        throw new UserError(
          'old_authentication_data is different than authentication_data in the database'
        );
      }

      // update the csp in the current transaction
      const transactionalCsps = new CloudStorageProviders({ knex: trx });
      return transactionalCsps.update(csp.id, {
        authentication_data: new_authentication_data,
      });
    });
  }
}

/**
 * EncryptedUserKeyData DAO.
 * It has an additional data loader:
 * - `forUser` which allows to load all encrypted user keys by user id.
 */
class EncryptedUserKeyData extends Model {
  constructor(...args) {
    super(...args);

    this.forUser = relatedItemsLoader(
      this.knex,
      this.tableName,
      'user_id',
      'device_id'
    );
  }

  get tableName() {
    return 'encrypted_user_key_data';
  }
}

/**
 * Organizations DAO
 */
class Organizations extends Model {
  get tableName() {
    return 'organizations';
  }

  /**
   * Check if the organization name is available
   * @param {string} display_name - the name to check
   * @param {Object} options - currently `ignoredId` is supported. If provided
   * the organization with the id is ignored (used for changing the organization
   * name - the name could be the same as before)
   * @returns {Promise<boolean>}
   */
  async checkIfNameAvailable(display_name, options = {}) {
    const { ignoredId } = options;
    let baseQuery = this.getTable().where({ display_name }).select('id');
    if (ignoredId) {
      baseQuery = baseQuery.where('id', '!=', ignoredId);
    }
    const existsQuery = this.knex
      .raw(baseQuery)
      .wrap('SELECT EXISTS (', ') as exists');
    const queryResult = await existsQuery;
    return !queryResult.rows[0].exists;
  }

  /**
   * Get a list of storage types enabled for an organization
   * (or all types if some are not explicitly enabled)
   * @param {number|string} organization_id - the id of the organization to check
   * @returns {Promise<Array>}
   */
  async getEnabledStorageTypes(organization_id) {
    const organization = await this.get(organization_id);
    // return empty list if the enabled storage types are not specified
    if (organization.enabled_storage_types == null) {
      return [...StorageTypes];
    }
    return organization.enabled_storage_types;
  }

  validateItem(organization) {
    // treat organizations with `deleted_at` attribute as non-existent
    if (organization.deleted_at) {
      return false;
    }
    return true;
  }
}

/**
 * Policies DAO. It has an additional data loader:
 * - `forOrganization` which allows to load policies by organization id.
 */
class Policies extends Model {
  constructor(...args) {
    super(...args);
    this.forOrganization = relatedItemsLoader(
      this.knex,
      this.tableName,
      'organization_id',
      'id'
    );
  }

  get tableName() {
    return 'policies';
  }
}

class Resellers extends Model {
  get tableName() {
    return 'resellers';
  }
}

class ResellerProviders extends Model {
  async getByIdAndToken(id, token) {
    // Don't try to load reseller data from db if the id is in incorrect format
    // - throws on the Postgres side otherwise
    if (!uuidValidate(id)) {
      return null;
    }
    const provider = await this.get(id);
    if (provider.token !== token) {
      return null;
    }
    return provider;
  }

  get tableName() {
    return 'resellers_providers';
  }
}

/**
 * Share keys DAO
 */
export class ShareKeys extends Model {
  getByShareAndUser(share, user) {
    return this.getTable()
      .where({
        share_id: share.id,
        user_id: user.id,
      })
      .first();
  }

  get tableName() {
    return 'share_keys';
  }
}

/**
 * Shares DAO. It has an additional data loader:
 * - `forCsp` - load all shares for by the CSP storage_type and storage_unique_id
 * - `forOrganization`- load all shares by organization id.
 */
export class Shares extends Model {
  constructor(...args) {
    super(...args);

    this.forOrganization = relatedItemsLoader(
      this.knex,
      this.tableName,
      'organization_id',
      'name'
    );

    this.forCsp = new DataLoader(
      async keys => {
        let query = this.knex(this.tableName);
        // IDs are not used here as keys because it's possible that the same
        // storage accounts are used by many users and same CSP entities
        // were saved in the database after saving the Share.
        keys.forEach(([storage_type, storage_unique_id]) => {
          query = query.orWhere(
            this.knex.raw(
              // PostgreSQL array syntax. Use `@>` instead of `ANY` because
              // indexes are used in former.
              'storage_type = ? AND storage_unique_ids @> ARRAY[?]',
              [storage_type, storage_unique_id]
            )
          );
        });
        const result = await query;
        return keys.map(([storage_type, storage_unique_id]) =>
          result.filter(
            share =>
              share.storage_type === storage_type &&
              share.storage_unique_ids.includes(storage_unique_id)
          )
        );
      },
      // stringify keys to make arrays of the same values equivalent
      { cacheKeyFn: key => JSON.stringify(key) }
    );
  }

  get tableName() {
    return 'shares';
  }
}

/**
 * Sync rules DAO. It has an additional data loader:
 * - `forUser` which allows to load all sync rules by user id.
 */
class SyncRules extends Model {
  constructor(...args) {
    super(...args);
    this.forUser = relatedItemsLoader(
      this.knex,
      this.tableName,
      'user_id',
      'path'
    );
  }

  get tableName() {
    return 'sync_rules';
  }

  /**
   * Delete a sync rule for the user
   * @param {number|string} userId
   * @param {string[]} path
   * @returns {Promise}
   */
  deleteByUserAndPath(userId, path) {
    return this.deleteWhere({
      user_id: userId,
      path,
    });
  }
}

/**
 * Users DAO. It has an additional data loader:
 * - `forOrganization` which allows to load all users by organization id.
 */
export class Users extends Model {
  constructor(...args) {
    super(...args);
    this.forOrganization = relatedItemsLoader(
      this.knex,
      this.tableName,
      'organization_id',
      'email'
    );
  }

  async changePassword(user_id, password) {
    const passwordHash = await hashPassword(password);
    const newUser = await this.update(user_id, {
      password_hash: passwordHash,
    });
    return newUser;
  }

  /**
   * Check if the email is available (there is no user with this email in the
   * database)
   * @param {string} email - the email address to check
   * @returns {Promise<boolean>}
   */
  async checkIfEmailAvailable(email) {
    const baseQuery = this.getTable().where({ email }).select('id');
    const existsQuery = this.knex
      .raw(baseQuery)
      .wrap('SELECT EXISTS (', ') as exists');
    const queryResult = await existsQuery;
    return !queryResult.rows[0].exists;
  }

  /**
   * Delete an user from the database and save a copy of his data
   * in the `deleted_users` table
   * @param {Object} conditions - an object with organization_id
   * and the id of the user
   * @returns{Promise}
   */
  async deleteUser({ id, organization_id }) {
    await this.knex.transaction(async trx => {
      const user = await this.getTable()
        .where({
          organization_id,
          id,
        })
        .transacting(trx)
        .forUpdate()
        .first();
      if (!user) {
        throw new UserError('Cannot find user');
      }
      const shareKeys = await trx('share_keys').where({
        user_id: id,
      });
      const shareKeysData = pick(shareKeys, [
        'share_id',
        'encrypted_share_key',
        'created_at',
        'updated_at',
      ]);
      const { created_at, updated_at, ...rest } = user;
      await trx('deleted_users').insert({
        ...rest,
        original_created_at: created_at,
        original_updated_at: updated_at,
        share_keys: shareKeysData,
      });
      await this.getTable()
        .where({
          organization_id,
          id,
        })
        .transacting(trx)
        .delete();
    });

    this.byId.clearAll();
  }

  /**
   * Get a public key for a user (or null if the user doesn't exists / doesn't
   * belong to the organization or doesn't have a public key)
   * @param {string|number} organization_id - id of the organization the user
   * belongs to
   * @param {string} email - email of the user
   * @returns {Promise<string>}
   */
  async publicKeyForUser(organization_id, email) {
    const user = await this.getTable()
      .where({
        email,
        organization_id,
      })
      .first();
    if (!user) {
      return null;
    }
    return user.public_key;
  }

  get tableName() {
    return 'users';
  }

  getByEmail(email) {
    return this.getTable().where({ email }).first();
  }

  /**
   * Check if the user has administrator rights
   * @param {Object} user - the user to check
   * @returns {boolean}
   */
  isAdministrator(user) {
    return user.roles.includes(ADMINISTRATOR_ROLE);
  }

  /**
   * Update last request data for the user - IP address to the provided one
   * and the to current.
   * @param {number|string} userId
   * @param {string} ip - IP address
   * @param {object} options - additional options. Currently `updateLastLogin`
   * is supported - if it is set to true also `last_login` field is updated
   * @returns {Promise<Object>} updated user
   */
  updateLastRequestData(userId, ip, options = {}) {
    const now = new Date();
    const data = {
      last_request_ip: ip,
      last_request_time: now,
    };
    if (options.updateLastLogin) {
      data.last_login = now;
    }
    return this.update(userId, data);
  }

  /**
   * Save information that the user closed the admin console onboarding dialog
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  finishAcOnboarding(user) {
    if (!this.isAdministrator(user)) {
      throw new UserError('Not administrator');
    }

    return this.update(user.id, { ac_onboarding_finished: true });
  }
}

/**
 * A helper class for exchanging device keys. It has methods which use
 * multiple DAOs and transactions.
 */
class ExchangeKeysHelper {
  constructor({ knex, baseUsers }) {
    this.knex = knex;
    this.baseUsers = baseUsers;
  }

  /**
   * Initialize encryption for a user. This method sets the public_key
   * of the user and saves its first encrypted public key.
   * @param {Object} user
   * @param {Object} data - the encryption data. It should have the following
   * format: { public_user_key, public_device_key, device_id, encrypted_user_key }
   * @returns {Promise<Object>} - encrypted user key data
   */
  initUserKey(user, data) {
    const { public_user_key, ...rest } = data;

    if (user.public_key) {
      throw new UserError('The public key is already set');
    }

    return this.knex.transaction(async trx => {
      // transaction-aware versions of DAOs
      const encryptedUserKeyData = new EncryptedUserKeyData({ knex: trx });
      const users = new Users({ knex: trx });

      await users.update(user.id, { public_key: public_user_key });

      // invalidate a cache for the base users DAO instance
      this.baseUsers.byId.clear(user.id);

      return encryptedUserKeyData.create({
        ...rest,
        user_id: user.id,
      });
    });
  }

  /**
   * Approve a new device.
   * @param {*} user
   * @param {*} data - the encryption data. It should have the following
   * format: { public_device_key, device_id, encrypted_user_key }
   * @returns {Promise<Object>} - encrypted user key data
   */
  approveDevice(user, data) {
    return this.knex.transaction(async trx => {
      // transaction-aware versions of DAOs
      const approvalRequests = new ApprovalRequests({ knex: trx });
      const encryptedUserKeyData = new EncryptedUserKeyData({ knex: trx });

      // find an approval request
      const approvalRequest = await approvalRequests
        .getTable()
        .where({
          user_id: user.id,
          device_id: data.device_id,
          public_device_key: data.public_device_key,
        })
        .first();
      if (!approvalRequest) {
        throw new UserError('Cannot find the approval request');
      }

      // delete the approval request and then save the encrypted key data
      await approvalRequests.deleteWhere({ id: approvalRequest.id });
      return encryptedUserKeyData.create({
        ...data,
        user_id: user.id,
      });
    });
  }
}

/**
 * A helper class for shares and share keys
 */
class SharesHelper {
  constructor({ cloudStorageProviders, knex, shareKeys, shares, users }) {
    this.cloudStorageProviders = cloudStorageProviders;
    this.knex = knex;
    this.shareKeys = shareKeys;
    this.shares = shares;
    this.users = users;
  }

  /**
   * Create a share
   * @param {Object} data - the data of the share to create
   * @param {string|number} organization_id
   * @returns {Promise<Object>}
   */
  addShare(data, organization_id) {
    return this.shares.create({
      ...data,
      organization_id,
    });
  }

  /**
   * Add a share key for a user
   * @param {Object} data - share key data in the following format: {storage_type,
   * share_unique_id, encrypted_share_key, user_id}
   * @param {Object} currentUser - a user invoking the operation (
   * for checking if he/she is a memeber of the share). It is different
   * than the user the share key is created for.
   * @returns {Promise<Object>} - the newly created share key
   */
  async addShareKey(data, currentUser) {
    const share = await this.shares
      .getTable()
      .where({
        storage_type: data.storage_type,
        unique_id: data.share_unique_id,
        organization_id: currentUser.organization_id,
      })
      .first();

    if (!share) {
      throw new UserError('Cannot find the share');
    }

    const targetUser = await this.users.get(data.user_id);
    if (!targetUser) {
      throw new UserError('Cannot find the user');
    }

    // check if the current user belongs to the share
    const csp = await this.cloudStorageProviders
      .getTable()
      .where({
        user_id: currentUser.id,
      })
      .where('unique_id', 'in', share.storage_unique_ids)
      .first();

    if (!csp) {
      throw new UserError("You don't belong to the share");
    }

    return this.shareKeys.create({
      user_id: targetUser.id,
      share_id: share.id,
      encrypted_share_key: data.encrypted_share_key,
    });
  }

  /**
   * Find shares for a CSP filtered by an organization id
   * @param {Object} csp
   * @param {string|number} organization_id
   * @returns {Promise<Array>}
   */
  async findForCsp(csp, organization_id) {
    const shares = await this.shares.forCsp.load([csp.type, csp.unique_id]);
    return shares.filter(share => {
      // only return shares from the organization
      if (share && share.organization_id === organization_id) {
        return true;
      }
      return false;
    });
  }

  /**
   * Find CSPS with the Share
   * @param {Object} share
   * @returns {Promise<Array>}
   */
  async findCspsWithShare(share) {
    const cspsDao = this.cloudStorageProviders;

    // get the pairs [storage_type, unique_id] which is used by
    // the CloudStorageProviders.byTypeAndUniqueId loader
    const cspTypeAndUniqueIdPairs = share.storage_unique_ids.map(
      storage_unique_id => [share.storage_type, storage_unique_id]
    );
    // get CSPS
    const csps = await cspsDao.byTypeAndUniqueId.loadMany(
      cspTypeAndUniqueIdPairs
    );
    // csps is an array of arrays (loadMany return array and each result is
    // also an array)
    const flattenedCsps = flatten(csps);
    return flattenedCsps;
  }

  /**
   * Find CSPS with the Share and return a restricted proxy of them
   * (which allows public access only for some fields)
   * @param {Object} share
   * @returns {Promise<Array>}
   */
  async findCspsWithShareSafe(share) {
    const csps = await this.findCspsWithShare(share);
    return csps.map(cspInstance =>
      restrictedModelProxy(cspInstance, [
        'id',
        'csp_id',
        'display_name',
        'type',
        'unique_id',
        'user_id',
      ])
    );
  }

  /**
   * Check if a share has external users - users without CrossCloud account
   * @param {Object} share
   * @returns{Promise<boolean>}
   */
  async hasExternalUsers(share) {
    // find csps associates with the share
    const csps = await this.findCspsWithShare(share);
    // find unique ids of associated csps
    // NOTE: there can be multiple csp instances with the same unique_id,
    // because a single cloud storage account can be connected to many
    // CrossCloud users - so make sure the list consists of unique items
    const unique_ids = uniq(map(csps, 'unique_id'));
    // the share has external users if there is more storage unique ids
    // in the share entity than in the associated csps in the CC database
    return share.storage_unique_ids.length > unique_ids.length;
  }

  /**
   * Set a public key for the share and initial set of encrypted private keys
   * for memebers of the share
   * @param {Object} data - and object with the following format: {storage_type,
   * share_unique_id, public_share_key, encrypted_share_keys: [{user_id,
   * encrypted_share_key}]}
   * @param {Object} currentUser - a user invoking the operation (
   * for checking if he/she is a memeber of the share)
   * @returns {Promise<Object>} - the updated share
   */
  async initShareKeys(data, currentUser) {
    // run everything in transaction and add `FOR UPDATE` query modifier
    // getting the share to make the whole operation atomic
    return this.knex.transaction(async trx => {
      const cspsDao = this.cloudStorageProviders;
      const transactionalShareKeys = new ShareKeys({ knex: trx });
      const share = await this.shares
        .getTable()
        .transacting(trx)
        .forUpdate()
        .where({
          storage_type: data.storage_type,
          unique_id: data.share_unique_id,
          organization_id: currentUser.organization_id,
        })
        .first();

      if (!share) {
        throw new UserError('Cannot find the share');
      }

      if (share.public_share_key) {
        throw new UserError('The share has the public key already set up');
      }

      // check if the current user belongs to the share
      const csp = await cspsDao
        .getTable()
        .where({
          user_id: currentUser.id,
        })
        .where('unique_id', 'in', share.storage_unique_ids)
        .first();

      if (!csp) {
        throw new UserError("You don't belong to the share");
      }

      // Set a public key for the share
      const [updatedShare] = await this.shares
        .getTable()
        .transacting(trx)
        .where({
          id: share.id,
        })
        .update({
          public_share_key: data.public_share_key,
        })
        .returning('*');

      // save encrypted private keys for users belonging to the share
      await Promise.all(
        data.encrypted_share_keys.map(async encryptedKeyData => {
          // check if the user belongs to the share
          const cspForUser = await cspsDao
            .getTable()
            .where({
              user_id: encryptedKeyData.user_id,
            })
            .where('unique_id', 'in', share.storage_unique_ids)
            .first();

          if (!cspForUser) {
            throw new UserError(
              `User with id ${encryptedKeyData.user_id} doesn't belong to the share`
            );
          }
          return transactionalShareKeys.create({
            share_id: share.id,
            user_id: encryptedKeyData.user_id,
            encrypted_share_key: encryptedKeyData.encrypted_share_key,
          });
        })
      );

      return updatedShare;
    });
  }

  /**
   * Remove a user from the share and optionally remove the share
   * itself if there is no more connected CSPS.
   * @param {Object} user
   * @param {string} storage_type
   * @param {string} storage_unique_id
   * @param {string} share_unique_id
   * @returns {Promise<boolean>} - true if the user was removed from the share,
   * false otherwise
   */
  async removeUserFromShare(
    user,
    storage_type,
    storage_unique_id,
    share_unique_id
  ) {
    // ensure that the user has a CSP with the provided type and unique_id
    const csps = await this.cloudStorageProviders.byTypeAndUniqueId.load([
      storage_type,
      storage_unique_id,
    ]);
    const cspWithCurrentUser = csps.find(csp => csp.user_id === user.id);
    if (!cspWithCurrentUser) {
      return false;
    }

    // get all shares for the CSP
    const shares = await this.findForCsp(
      cspWithCurrentUser,
      user.organization_id
    );

    const filteredShares = shares.filter(
      share => share.unique_id === share_unique_id
    );

    if (!filteredShares.length) {
      return false;
    }

    await Promise.all(
      filteredShares.map(async share => {
        if (share.storage_unique_ids.length <= 1) {
          // if there is only one (the one for the user) CSP connected with
          // the share - just delete it
          await this.shares.deleteWhere({ id: share.id });
        } else {
          // otherwise find how many combinations of [storage_type, storage_unique_id]
          // for this share is saved in the database
          const cspsWithShare = await this.findCspsWithShare(share);
          if (cspsWithShare.length <= 1) {
            // only one (the one for the user) - delete the share
            await this.shares.deleteWhere({ id: share.id });
          } else {
            // more than one - update the share
            await this.shares.update(share.id, {
              storage_unique_ids: share.storage_unique_ids.filter(
                uniqueId => uniqueId !== storage_unique_id
              ),
            });
          }
        }

        // clear dataloader cache
        this.cloudStorageProviders.byTypeAndUniqueId.clear();
      })
    );

    return true;
  }

  /**
   * Get a list of users having the share.
   * @param {Object} share
   * @returns {Promise<Array>}
   */
  async usersWithShare(share) {
    const usersDao = this.users;

    // get CSPS
    const csps = await this.findCspsWithShare(share);
    const userIds = csps
      .filter(csp => !!csp)
      .map(csp => csp.user_id)
      .filter(id => !!id);
    // make sure there is no duplicated used ids to not display
    // each user more than once
    const uniqueUserIds = uniq(userIds);
    const users = await usersDao.byId.loadMany(uniqueUserIds);
    return users;
  }

  /**
   * Get a list of members of the share which don't have a share key.
   * @param {Object} share
   * @returns {Promise<Array>}
   */
  async usersWithoutShareKeys(share) {
    // get CSPS
    const csps = await this.findCspsWithShare(share);
    const userIds = csps
      .filter(csp => !!csp)
      .map(csp => csp.user_id)
      .filter(id => !!id);
    // make sure there is no duplicated user ids
    const uniqueUserIds = uniq(userIds);

    const idsOfUsersWithShareKey = await this.shareKeys
      .getTable()
      .select('user_id')
      .where({
        share_id: share.id,
      })
      .pluck('user_id');
    const idsOfUsersWithoutShareKey = difference(
      uniqueUserIds,
      idsOfUsersWithShareKey
    );
    const users = await this.users.byId.loadMany(idsOfUsersWithoutShareKey);
    return users;
  }
}

/**
 * A helper class for user operations which require access to other DAOs
 */
class UsersHelper {
  constructor({ knex, organizations, users }) {
    this.knex = knex;
    this.organizations = organizations;
    this.users = users;
  }

  /**
   * Get user by its email and password. A user is loaded from the database
   * by its email and than its saved password hash is compared with the provided
   * one. If its correct the user is returned, null otherwise.
   * @param {String} email
   * @param {String} password
   * @returns {Promise<Object>}
   */
  async getByEmailAndPassword(email, password) {
    const user = await this.users.getTable().where({ email }).first();
    if (user) {
      const isEnabled = await this.isUserEnabled(user);
      if (!isEnabled) {
        // don't allow to login a disabled user
        return null;
      }
      const isPasswordCorrect = await checkPassword(
        password,
        user.password_hash
      );

      if (isPasswordCorrect) {
        return user;
      }
    }

    return null;
  }

  /**
   * Check is the user should be treat as enabled or not
   * This method also checks the status of the organization the user belongs
   * to (if it's disabled or marked as deleted)
   * @param {Object} user 
   * @returns {Promise<boolean>}
   */
  async isUserEnabled(user) {
    if (!user) {
      return false;
    }
    // it can return null if the organization has the `deleted_at` field set
    const organization = await this.organizations.get(user.organization_id);
    if (!(organization && organization.is_enabled)) {
      return false;
    }
    return user.is_enabled;
  }
}

class RegistrationHelper {
  constructor({ knex }) {
    this.knex = knex;
  }

  /**
   * Register a new user and create a new organization for him
   * @param {Object} data - data for a new user and an organization
   */
  async register({
    company_name,
    email,
    password,
    user_name,
    reseller_id,
    users_limit,
  }) {
    let passwordHash;

    // password is optional for registration with resellers
    if (password) {
      passwordHash = await hashPassword(password);
    }
    return this.knex.transaction(async trx => {
      // create transactional helpers
      const organizations = new Organizations({ knex: trx });
      const users = new Users({ knex: trx });

      const organizationName = company_name || generateRandomCompanyName();
      const newOrganization = await organizations.create({
        display_name: organizationName,
        // the fields below are optional - used by the resellers module
        reseller_id,
        users_limit,
      });
      return users.create({
        organization_id: newOrganization.id,
        email,
        name: user_name,
        password_hash: passwordHash,
        roles: ['administrator', 'user'],
      });
    });
  }
}

/**
 * A helper class for queries which should be limited to users with
 * the administrator rights. Methods in this class should be limited to
 * the organization of the user provided as a second argument.
 */
class AdminHelper {
  /**
   * Create an admin helper
   * @param {Object} knex - an instance of the knex.js object
   * @param {Object} currentUser - an instance of the user object (he/she
   * should has the 'administrator' role)
   * @param {Object} models - an object with models / DAO objects returned
   * by the `createModels` function
   */
  constructor(knex, currentUser, models) {
    this.knex = knex;
    this.currentUser = currentUser;
    this.organization_id = currentUser.organization_id;
    this.models = models;
  }

  /**
   * Add a CSP for a user in the current organization
   * @param {number|string} user_id
   * @param {Object} data - the CSP data
   * @returns {Promise<Object>} data of the newly created CSP
   */
  async addCloudStorageProviderForUser(user_id, data) {
    const user = await this.getUser(user_id);
    if (!user) {
      throw new Error(`Cannot add a CSP for a user with id ${user_id}`);
    }
    const result = await this.models.cloudStorageProviders.create({
      ...data,
      user_id: user.id,
    });
    return result;
  }

  /**
   * Add a policy to the current organization
   * @param {Object} data - the policy data
   * @returns {Promise<Object>} data of the newly created policy
   */
  addPolicy(data) {
    validatePolicy(data);
    return this.models.policies.create({
      ...data,
      organization_id: this.organization_id,
    });
  }

  /**
   * Add a user to the database (hashing its password before) and add it
   * to the current organization.
   * @param {Object} data - data of the user (with a password field which
   * will be replaced with a hash)
   * @returns {Promise<Object>} the newly created user
   */
  async createUser(data) {
    // password is not saved to the database
    // calculate its hash instead
    const newUser = await this.models.users.create({
      ...data,
      organization_id: this.organization_id,
      roles: ['user'],
    });

    // Send 'Set password' email to the user
    await this.models.emails.sendResetPasswordEmail(newUser, { initial: true });
    return newUser;
  }

  /**
   * Delete a CSP for the user. The method checks if the user belongs
   * to the current organization.
   * @param {number|string} user_id
   * @param {string} csp_id
   * @returns {Promise}
   */
  async deleteCloudStorageProviderForUser(user_id, csp_id) {
    const user = await this.getUser(user_id);
    if (!user) {
      throw new Error(`Cannot delete a CSP for a user with id ${user_id}`);
    }
    const result = await this.models.cloudStorageProviders.deleteWhere({
      user_id,
      csp_id,
    });
    return result;
  }

  /**
   * Delete a policy in the current organization
   * @param {number|string} id - the policy id
   * @returns {Promise}
   */
  deletePolicy(id) {
    return this.models.policies.deleteWhere({
      id,
      organization_id: this.organization_id,
    });
  }

  /**
   * Delete a user in the current organization
   * @param {number|string} id - the user id
   * @returns {Promise}
   */
  async deleteUser(id) {
    if (id === this.currentUser.id) {
      throw new UserError('You cannot delete yourself');
    }
    await this.ensureNotResellersAdmin(id);
    return this.models.users.deleteUser({
      id,
      organization_id: this.organization_id,
    });
  }

  /**
   * Disable encryption in the current organization
   * @returns {Promise<Object>} - the updated organization
   */
  disableEncryption() {
    return this.models.organizations.update(this.organization_id, {
      encryption_enabled: false,
      encryption_master_key: null,
    });
  }

  /**
   * Enable encryption in the current organization
   * @param {Object} data - the encryption settings (`master_key`,
   * `encrypt_external_shares`, `encrypt_public_shares`, `csps_settings`)
   * @returns {Promise<Object>} - the updated organization
   */
  enableEncryption(data) {
    if (data.master_key && !data.master_key.match(PEM_PUBLIC_KEY_RE)) {
      throw new UserError('The master_key has an incorrect format');
    }
    return this.models.organizations.update(this.organization_id, {
      encryption_enabled: true,
      encryption_master_key: data.master_key,
      encrypt_external_shares: data.encrypt_external_shares,
      // not yet supported
      // encrypt_public_shares: data.encrypt_public_shares,
      encryption_csps_settings: data.csps_settings,
    });
  }

  async ensureNotResellersAdmin(userId) {
    const user = await this.models.users.get(userId);
    if (user.is_resellers_admin) {
      throw new UserError(
        'Cannot perform the operation on a resellers admin user'
      );
    }
  }

  /**
   * Update encryption settings in the current organization. Requires that
   * encryption is already enabled.
   * @param {Object} data - the encryption settings (`encrypt_external_shares`,
   * `encrypt_public_shares`, `csps_settings`)
   * @returns {Promise<Object>} - the updated organization
   */
  async updateEncryption(data) {
    const organization = await this.models.organizations.get(
      this.organization_id
    );
    if (!organization.encryption_enabled) {
      throw new UserError('Encryption is not enabled for the organization');
    }
    return this.models.organizations.update(this.organization_id, {
      encrypt_external_shares: data.encrypt_external_shares,
      // not yet supported
      // encrypt_public_shares: data.encrypt_public_shares,
      encryption_csps_settings: data.csps_settings,
    });
  }

  /**
   * Return an instance of StatsHelper for the current organization. StatsHelper
   * works as a resolver for the `Stats` schema type.
   * @returns {StatsHelper}
   */
  getStatsHelper() {
    return new StatsHelper(this.knex, this.models, this.organization_id); // eslint-disable-line no-use-before-define
  }

  /**
   * Get a user if he/she belongs to the current organization
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async getUser(id) {
    const user = await this.models.users.byId.load(id);
    return this.returnIfInOrganization(user);
  }

  /**
   * Get activity logs for the current organization (optionally paginated
   * or filtered for the selected user)
   * Possible options (both optional):
   * - before {number|string} - max id of the activity log (for cursor based
   * pagination)
   * - user_id {number|string} - show activity logs only for a user with this id
   * @returns {Promise<Object[]>}
   */
  loadActivityLogs({ before, user_id }) {
    const extraFilters = {
      organization_id: this.organization_id,
    };
    // Filtering by user is optional. If not provided show all activity logs
    // for the organization
    if (user_id) {
      extraFilters.user_id = user_id;
    }
    return loadConnection(this.knex, this.models.activityLogs.tableName, {
      before,
      extraFilters,
      last: 20,
    });
  }

  /**
   * Load all shares from the current organization
   * @returns {Promise<Object[]>}
   */
  async loadShares({ user_id }) {
    if (user_id) {
      // TODO: try to do it in one DB query
      const csps = await this.models.cloudStorageProviders.forUser.load(
        user_id
      );
      const cspsTypeUniqueIdPairs = csps.map(csp => [csp.type, csp.unique_id]);
      const shares_lists = await this.models.shares.forCsp.loadMany(
        cspsTypeUniqueIdPairs
      );
      return flatten(shares_lists);
    }
    return this.models.shares.forOrganization.load(this.organization_id);
  }

  /**
   * Load all users from the current organization
   * @returns {Promise<Object[]>}
   */
  loadUsers() {
    return this.models.users.forOrganization.load(this.organization_id);
  }

  async updateOrganizationContactData(data) {
    const validatedData = await validateContactData(data, {
      ignoredId: this.organization_id,
      models: this.models,
    });
    return this.models.organizations.update(
      this.organization_id,
      validatedData
    );
  }

  /**
   * Set which storage types should be enabled in the organization
   * @param {Array} enabled - a list of storage types to enable
   * in the organization or "null" if all types should be enabled
   * @returns {Promise<object>}
   */
  updateEnabledStorageTypes(enabled) {
    return this.models.organizations.update(this.organization_id, {
      enabled_storage_types: enabled,
    });
  }

  async resetUserKeys(user_id) {
    // ensure that the user is a member of the organization
    const user = await this.getUser(user_id);
    if (!user) {
      throw new UserError('Cannot find user');
    }
    await this.knex.transaction(async trx => {
      // transaction-aware versions of DAOs
      const approvalRequests = new ApprovalRequests({ knex: trx });
      const encryptedUserKeyData = new EncryptedUserKeyData({ knex: trx });
      const shareKeys = new ShareKeys({ knex: trx });
      const users = new Users({ knex: trx });

      await users.update(user_id, { public_key: null });
      await approvalRequests.deleteWhere({
        user_id,
      });
      await encryptedUserKeyData.deleteWhere({
        user_id,
      });
      await shareKeys.deleteWhere({
        user_id,
      });
    });
    this.models.users.byId.clear(user_id);
    return this.models.users.get(user_id);
  }

  setLoggingEnabled(enable) {
    return this.models.organizations.update(this.organization_id, {
      logging_enabled: enable,
    });
  }

  /**
   * Enable or disable a user in the current organization
   * @param {number|string} id
   * @param {boolean} enable - should the user be enabled or disabled
   * @returns {Promise<Object>} - the updated user
   */
  async setUserEnabled(id, enable) {
    if (id === this.currentUser.id) {
      throw new UserError('You cannot disable yourself');
    }
    await this.ensureNotResellersAdmin(id);
    return this.updateUserData(id, { is_enabled: enable });
  }

  /**
   * Change the name of a user
   * @param {number|string} id
   * @param {string} name - a new user name
   * @returns {Promise<Object>} - the updated user
   */
  setUserName(id, name) {
    return this.updateUserData(id, { name });
  }

  /**
   * Set roles for a user in the current organization
   * @param {number|string} id
   * @param {string[]} - a list with user roles
   * @returns {Promise<Object>} - the updated user
   */
  async setUserRoles(id, roles) {
    await this.ensureNotResellersAdmin(id);
    return this.updateUserData(id, { roles });
  }

  /**
   * Update a policy in the current organization
   * @param {number|string} id
   * @param {data} - new policy data
   * @returns {Promise<Object>} - the updated policy
   */
  updatePolicy(id, data) {
    validatePolicy(data);
    return this.models.policies.updateWhere(
      {
        id,
        organization_id: this.organization_id,
      },
      data
    );
  }

  /**
   * @private
   * Update data for a user but only if he/she begins to the current
   * organization
   */
  updateUserData(id, data) {
    return this.models.users.updateWhere(
      {
        id,
        organization_id: this.organization_id,
      },
      data
    );
  }

  /**
   * @private
   * Check if the provided item belongs to the current organization (has the
   * correct value of the `organization_id` id property) and return it (or null
   * otherwise)
   */
  returnIfInOrganization(item) {
    if (!item) {
      return null;
    }
    if (item.organization_id !== this.organization_id) {
      return null;
    }
    return item;
  }
}

/**
 * A helper class implementing operations required by the `resellers` module
 */
class ResellersHelper {
  /**
   * Construct a resellers helper. It requires an object with the following
   * props as an argument:
   * - knex - an instance of the knex.js object
   * - models - an object with DAOs (creted by the `createResellersModels`
   * function)
   * - the id of the current provider
   */
  constructor({ knex, models, providerId }) {
    this.knex = knex;
    this.models = models;
    this.providerId = providerId;
  }

  /**
   * Load organizations data from db ensuring that it was created by the
   * current provider and reseller
   * @param {String} reseller_id
   * @param {String} id
   * @returns {Promise<Object>} 
   */
  async getOrganization(reseller_id, id) {
    const organization = await this.models.organizations.get(id);
    if (!organization) {
      return null;
    }

    // only show organizations created by current reseller
    if (organization.reseller_id !== reseller_id) {
      return null;
    }

    // ensure that the reseller was created by the current provider
    const reseller = await this.getReseller(reseller_id);
    if (!reseller) {
      return null;
    }
    return organization;
  }

  /**
   * Load organizations data from db ensuring that it was created by the
   * current provider and reseller. Throws if it's not possible to find it
   * or was created by a different reseller.
   * @param {String} reseller_id
   * @param {String} id
   * @returns {Promise<Object>} 
   */
  async getOrganizationOrThrow(reseller_id, id) {
    const organization = await this.getOrganization(reseller_id, id);
    if (!organization) {
      throw new UserError(
        'Non-existing organization or created by a different reseller'
      );
    }
    return organization;
  }

  /**
   * Returns a reseller instance ensuring that it was created by the current
   * provider
   * @param {String} reseller_id
   * @returns {Promise<Object>} 
   */
  async getReseller(reseller_id) {
    const reseller = await this.models.resellers.get(reseller_id);
    if (!reseller) {
      return null;
    }
    if (reseller.provider_id !== this.providerId) {
      return null;
    }
    return reseller;
  }

  /**
   * Returns a reseller instance ensuring that it was created by the current
   * provider. Throws if it doesn't exist or was created by a different provider.
   * @param {String} reseller_id
   * @returns {Promise<Object>} 
   */
  async getResellerOrThrow(reseller_id) {
    const reseller = await this.getReseller(reseller_id);
    if (!reseller) {
      throw new UserError(
        'Non-existing reseller or created by a different provider'
      );
    }
    return reseller;
  }

  createReseller(input = {}) {
    return this.models.resellers.create({
      ...input,
      provider_id: this.providerId,
    });
  }

  async deleteReseller(id) {
    // ensure that the reseller was created by the current provider
    await this.getResellerOrThrow(id);
    return this.models.resellers.deleteWhere({ id });
  }

  async createOrganization(input) {
    // ensure that the reseller was created by the current provider
    await this.getResellerOrThrow(input.reseller_id);

    // create an organization and a super admin user inside a transaction
    return this.knex.transaction(async trx => {
      // transaction-aware versions of DAOs
      const organizations = new Organizations({ knex: trx });
      const users = new Users({ knex: trx });

      const organization = await organizations.create({
        reseller_id: input.reseller_id,
        display_name: input.company_name || generateRandomCompanyName(),
        admin_email: input.admin_contact_email,
        users_limit: input.users_limit,
      });

      // create a superadmin user
      await users.create({
        organization_id: organization.id,
        email: `${organization.id}@resellers-admins.crosscloud.io`,
        name: `${input.company_name} admin`,
        is_resellers_admin: true,
        roles: ['administrator'],
      });

      return organization;
    });
  }

  async disableOrganization(reseller_id, id) {
    const organization = await this.getOrganizationOrThrow(reseller_id, id);
    return this.models.organizations.update(organization.id, {
      is_enabled: false,
    });
  }

  async enableOrganization(reseller_id, id) {
    const organization = await this.getOrganizationOrThrow(reseller_id, id);
    return this.models.organizations.update(organization.id, {
      is_enabled: true,
    });
  }

  async deleteOrganization(reseller_id, id) {
    const organization = await this.getOrganizationOrThrow(reseller_id, id);
    await this.models.organizations.update(organization.id, {
      deleted_at: new Date(),
    });
    // successfully deleted
    return true;
  }

  async setUsersLimit({ reseller_id, id, limit }) {
    const organization = await this.getOrganizationOrThrow(reseller_id, id);
    return this.models.organizations.update(organization.id, {
      users_limit: limit,
    });
  }

  async getAdminLoginUrl(organization) {
    const checkedOrganization = await this.getOrganizationOrThrow(
      organization.reseller_id,
      organization.id
    );
    if (!checkedOrganization) {
      return null;
    }

    // find the oldest user with the 'administrator' role inside the organization
    const superadmin = await this.knex('users')
      .where({
        organization_id: checkedOrganization.id,
        is_resellers_admin: true,
      })
      .first();

    if (!superadmin) {
      return null;
    }

    return getAdminAutoLoginUrl(superadmin);
  }
}

/**
 * Return an object with instances of all "models" (DAO objects).
 * It should be created separately for each request, because we want to have
 * fresh DataLoader caches.
 */
export function createModels({ knex }) {
  // some DAOs are used in related DAOs or helpers
  const cloudStorageProviders = new CloudStorageProviders({ knex });
  const organizations = new Organizations({ knex });
  const users = new Users({ knex });
  const shareKeys = new ShareKeys({ knex });
  const shares = new Shares({ knex });

  return {
    activityLogs: new ActivityLogs({ knex }),
    approvalRequests: new ApprovalRequests({ knex }),
    cloudStorageProviders,
    emails: createEmailHelper(),
    encryptedUserKeyData: new EncryptedUserKeyData({ knex }),
    exchangeKeysHelper: new ExchangeKeysHelper({ knex, baseUsers: users }),
    organizations,
    policies: new Policies({ knex }),
    registrationHelper: new RegistrationHelper({ knex }),
    shareKeys,
    sharesHelper: new SharesHelper({
      cloudStorageProviders,
      knex,
      shareKeys,
      shares,
      users,
    }),
    shares,
    syncRules: new SyncRules({ knex }),
    usersHelper: new UsersHelper({ knex, organizations, users }),
    users,
  };
}

/**
 * Create an instance of the AdminHelper. Look at the class documentation
 * for the arguments description. If the user doesn't have the `administrator`
 * role a fake, always throwing instance is returned instead.
 */
export function createAdminHelper(knex, currentUser, models) {
  if (!models.users.isAdministrator(currentUser)) {
    return createFakeAdminProxy();
  }
  return new AdminHelper(knex, currentUser, models);
}

/**
 * Create a fake admin proxy for a user without the `administrator` role.
 * Each method of it throws.
 */
function createFakeAdminProxy() {
  const handler = {
    get: () => {
      throw new AdminRightsRequiredError();
    },
  };

  return new Proxy({}, handler);
}

/**
 * Create a proxy which returns values only for whitelisted fields,
 * `undefined` otherwise
 */
export function restrictedModelProxy(instance, whitelist) {
  const whitelistSet = new Set(whitelist);

  const handler = {
    get: (target, name) => {
      if (whitelistSet.has(name)) {
        return target[name];
      }

      // Alternatively
      // throw new UserError('Access denied');
      return undefined;
    },
  };

  return new Proxy(instance, handler);
}

/**
 * Return an object with instances of all "models" (DAO objects) used
 * by the `resellers` module.
 * It should be created separately for each request, because we want to have
 * fresh DataLoader caches.
 */
export function createResellersModels({ knex }) {
  return {
    emails: createEmailHelper(),
    organizations: new Organizations({ knex }),
    resellerProviders: new ResellerProviders({ knex }),
    resellers: new Resellers({ knex }),
  };
}

/**
 * Return a new instance of the resellers helper
 */
export function createResellersHelper({ knex, models, providerId }) {
  return new ResellersHelper({
    knex,
    models,
    providerId,
  });
}

function generateRandomCompanyName() {
  const bytes = [];
  uuidv4(null, bytes);
  const encodedName = base32.encode(bytes).substr(0, 16);
  return `Team-${encodedName}`;
}
