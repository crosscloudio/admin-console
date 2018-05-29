import GraphQLDate from 'graphql-date';
import GraphQLJSON from 'graphql-type-json';
import { buildSchema } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';

import UserError from './utils/UserError';
import {
  adminOnly,
  allFieldsPublic,
  authorized,
  ensureAuthorizationSetup,
} from './utils/schema/authorization';
import { restrictedModelProxy } from './models';
import { schema as statsSchema } from './stats/schema';

// A schema defined using GraphQL type language - http://graphql.org/learn/schema/
// Resolvers are defined below. For more information look at
// https://dev-blog.apollodata.com/graphql-explained-5844742f195e#.362cglivn
// `Stats` types are defined in a separate module.
const rootSchema = [
  `

scalar Date
scalar JSON

type ActivityLog {
  id: String!
  type: String!
  timestamp: Date!
  path: [String!]!
  encrypted: Boolean!
  shared: Boolean!
  bytes_transferred: Float
  storage_id: String
  mime_type: String!
  status: String!
  user: User
}

type ActivityLogCollection {
  entries: [ActivityLog]!
  pageInfo: PageInfo!
}

# Input type for recording activities. It has some fields nullable
# (they have default values)
input ActivityLogInput {
  type: String!
  timestamp: Date!
  path: [String!]!
  encrypted: Boolean
  shared: Boolean
  bytes_transferred: Float
  storage_id: String
  mime_type: String
  status: String
}

type ApprovalRequest {
  public_device_key: String!
  device_id: String!
}

type CloudStorageProvider {
  id: String!

  # client side generated id
  csp_id: String!
  display_name: String!
  type: String!
  unique_id: String!
  authentication_data: String

  shares: [Share]
  user: User
}

input CloudStorageProviderInput {
  # client side generated id
  csp_id: String!
  display_name: String!
  type: String!
  unique_id: String!
  authentication_data: String
}

type CreateUserPayload {
  # plan info data could be updated
  organization: Organization
  user: User
}

type CspEncryptionSettings {
  type: String!
  enabled: Boolean!
}

input CspEncryptionSettingsInput {
  type: String!
  enabled: Boolean!
}

input EncryptedShareKeyInput {
  user_id: String!
  encrypted_share_key: String!
}

type EncryptedUserKeyData {
  public_device_key: String!
  device_id: String!
  encrypted_user_key: String!
}

type OrganizationEncryptionSettings {
  # Is the encryption enabled?
  enabled: Boolean!
  master_key: String
  encrypt_external_shares: Boolean!
  encrypt_public_shares: Boolean!
  csps_settings: [CspEncryptionSettings]
}

type Organization {
  id: String!
  display_name: String!
  encryption: OrganizationEncryptionSettings
  policies: [Policy]!
  logging_enabled: Boolean!
  has_available_licenses: Boolean
  users_count: Int
  users_limit: Int
  admin_phone: String
  admin_email: String
  billing_phone: String
  billing_email: String
  # A list of storage types enabled in the organization
  # All types are enabled if "null" is returned
  enabled_storage_types: [String]

  # was the organization created by the resellers module
  is_resold: Boolean
}

# a simpler version of Relay PageInfo
type PageInfo {
  endCursor: String
  hasNextPage: Boolean!
}

type Policy {
  id: String!
  name: String!
  type: String!
  criteria: String!
  is_enabled: Boolean!
}

input PolicyInput {
  name: String!
  type: String!
  criteria: String!
  is_enabled: Boolean
}

type Share {
  # database generated id
  id: String!
  name: String!

  storage_type: String!

  # unique id of the storage from the CSP
  unique_id: String!

  # a list of the users having the share. Only 'id' and 'email' fields are
  # available to anyone
  users: [User]

  # A list of 'unique_id' of the CSPs the share is related to
  storage_unique_ids: [String!]

  # A list of csps the share is related to
  csps: [CloudStorageProvider!]

  # An encryption key for the share for the current user
  share_key_for_current_user: ShareKey

  users_without_share_key: [User]

  # Has the share users which don't have a CrossCloud account?
  has_external_users: Boolean!

  public_share_key: String
  encrypted: Boolean!

  created_at: Date
  updated_at: Date
}

input ShareInput {
  name: String!
  storage_type: String!

  # unique id of the storage from the CSP
  unique_id: String!

  # A list of 'unique_id' of the CSPs the share is related to
  storage_unique_ids: [String!]!
}

type ShareKey {
  encrypted_share_key: String!
}

type SyncRule {
  id: String!
  path: String!
  csp_ids: [String!]!
}

input UpdateOrganizationContactDataInput {
  display_name: String!
  admin_phone: String
  admin_email: String
  billing_phone: String
  billing_email: String
}

type User {
  id: String!
  email: String!
  name: String!

  # Organization to which the user belongs
  organization: Organization!
  machine_id: String
  public_key: String

  # Cloud storage accounts of the user
  csps: [CloudStorageProvider]!

  sync_rules: [SyncRule]!

  # A profile image of the user
  image: String!

  is_enabled: Boolean!
  roles: [String]!

  approval_requests: [ApprovalRequest]
  encrypted_user_keys: [EncryptedUserKeyData]

  enabled_storage_types: [String]

  last_request_ip: String
  last_request_time: Date

  # Does the user have the admin console onboarding finished?
  ac_onboarding_finished: Boolean

  # Does the user is the admin created by the resellers module?
  is_resellers_admin: Boolean
}

type Query {
  # Activity logs in the current organization. Optionally filtered by user id.
  # Support pagination with the _before_ argument.
  # Requires administrator role to run.
  activityLogs(user_id: String, before: String): ActivityLogCollection

  # Currently logged in user
  currentUser: User

  # Public keys for any user in the current organization
  publicKeyForUser(email: String!): String

  # Shares in the current organization
  # Requires administrator role to access
  shares(user_id: String): [Share]

  # Statistics for the current organization
  # Requires administrator role to access
  stats: Stats

  # Users in the organization
  # Requires administrator role to access
  users: [User]

  # A single user in the organization by Id
  # Requires administrator role to access
  user(id: String!): User
}

type Mutation {
  addActivityLog(input: ActivityLogInput!): ActivityLog!
  updateUserConfig(machine_id: String, public_key: String): User!

  # add a cloud storage provider for the current user
  addCloudStorageProvider(input: CloudStorageProviderInput!): CloudStorageProvider!

  # delete a cloud storage provider for the current user
  deleteCloudStorageProvider(csp_id: String!): User!

  # update authentication_data for a cloud storage provider
  # old_authentication_data is used as a locking field
  updateCspAuthData(
    csp_id: String!,
    old_authentication_data: String!,
    new_authentication_data: String!,
  ): CloudStorageProvider!

  # add a sync rule for the current user
  addSyncRule(path: String!, csp_ids: [String]!): SyncRule

  # delete a sync rule for the current user
  deleteSyncRule(path: String!): User

  # Add a first encrypted user key for the current user.
  initUserKey(
    public_user_key: String!,
    public_device_key: String!,
    device_id: String!,
    encrypted_user_key: String!,
  ): EncryptedUserKeyData

  # request a new device approval for the current user
  requestDeviceApproval(
    public_device_key: String!,
    device_id: String!,
  ): ApprovalRequest

  approveDevice(
    device_id: String!,
    public_device_key: String!,
    encrypted_user_key: String!,
  ): EncryptedUserKeyData

  declineDevice(
    device_id: String!,
    public_device_key: String!,
  ): Boolean

  # add a share in the current organization
  # Admin rights not required.
  addShare(input: ShareInput!): Share

  # update a share in the current organization
  # Admin rights not required.
  updateShare(
    storage_type: String!,
    unique_id: String!,
    storage_unique_ids: [String],
    name: String
  ): Share

  # delete a share from the current organization
  # Returns true if the share was deleted, false otherwise
  # Admin rights not required.
  deleteShare(storage_type: String!, unique_id: String!): Boolean

  # Remove a user from the share and optionally remove the share
  # itself if there is no more connected CSPS
  removeUserFromShare(
    storage_type: String!,
    storage_unique_id: String!,
    share_unique_id: String!,
  ): Boolean

  initShareKeys(
    storage_type: String!,
    share_unique_id: String!
    public_share_key: String!,
    encrypted_share_keys: [EncryptedShareKeyInput!]!,
  ): Share

  addShareKey(
    storage_type: String!
    # unique id of the share from the CSP
    share_unique_id: String!
    user_id: String!
    encrypted_share_key: String!
  ): ShareKey

  # create a user and add it to the organization of the current user
  # Requires administrator role to run
  createUser(
    email: String!,
    name: String!
    image: String,
    is_enabled: Boolean
  ): CreateUserPayload

  # set a user in the current organization enabled or disabled
  # Requires administrator role to run
  setUserEnabled(id: String!, enable: Boolean!): User

  # delete a user from the current organization
  # Requires administrator role to run
  deleteUser(id: String!): String

  # set roles for a user in the current organization
  # Requires administrator role to run
  setUserRoles(id: String!, roles: [String]!): User

  # set roles for a user in the current organization
  # Requires administrator role to run
  setUserName(id: String!, name: String!): User

  # reset user's public key and device keys
  # Requires administrator role to run
  resetUserKeys(id: String!): User

  # add a policy to the current organization
  # Requires administrator role to run
  addPolicy(input: PolicyInput!): Policy!

  # update a policy in the current organization
  # Requires administrator role to run
  updatePolicy(id: String!, input: PolicyInput!): Policy!

  # delete a policy in the current organization
  # Requires administrator role to run
  deletePolicy(id: String!): String

  # enable encryption in the current organization
  # Requires administrator role to run
  enableEncryption(
    master_key: String!
    encrypt_external_shares: Boolean!

    # not yet supported
    # encrypt_public_shares: Boolean!

    csps_settings: [CspEncryptionSettingsInput]!
  ): Organization

  # update encryption settings in the current organization
  # Requires administrator role to run
  updateEncryption(
    encrypt_external_shares: Boolean!

    # not yet supported
    # encrypt_public_shares: Boolean!

    csps_settings: [CspEncryptionSettingsInput]!
  ): Organization

  # disable encryption in the current organization
  # Requires administrator role to run
  disableEncryption: Organization

  # add a cloud storage provider for a user in the current organization
  # Requires administrator role to run
  addCloudStorageProviderForUser(
    user_id: String!
    input: CloudStorageProviderInput!
  ): CloudStorageProvider!

  # delete a cloud storage provider for a user in the current
  # organization
  # Requires administrator role to run
  deleteCloudStorageProviderForUser(user_id: String!, csp_id: String!): String

  # Enable or disable activity logs for the current organization
  # Requires administrator role to run
  setLoggingEnabled(enable: Boolean): Organization  

  # update contact data
  # Requires administrator role to run
  updateOrganizationContactData(
    input: UpdateOrganizationContactDataInput!
  ): Organization

  # Update enabled storage types for the current organization.
  # If "enabled" is null then all storage types are allowed.
  # Requires administrator role to run
  updateEnabledStorageTypes(
    enabled: [String!]
  ): Organization

  # save information that the current user closed the admin console onboarding
  # dialog
  finishAcOnboarding: User
}

schema {
  query: Query
  mutation: Mutation
}

`,
];

const schema = [...rootSchema, ...statsSchema];

// required by `authorized` helper
const schemaObject = buildSchema(schema.join('\n'));

function generateAuthorizedTypes(typeNames) {
  return typeNames.reduce((result, typeName) => {
    result[typeName] = authorized({ schemaObject, typeName })({});
    return result;
  }, {});
}

function generatePublicTypes(typeNames) {
  return typeNames.reduce((result, typeName) => {
    result[typeName] = allFieldsPublic({ schemaObject, typeName })({});
    return result;
  }, {});
}

// Resolvers are defined as simple functions which invokes corresponding methods
// in models / helpers as described in
// https://dev-blog.apollodata.com/how-to-build-graphql-servers-87587591ded5#.t903drgcn
// (pt. 2 - Choose the right abstractions)
// The last argument of each function is the context. It consists of instances
// of models and helpers (separate for each HTTP request) - the result
// of invoking `createModels` and `createAdminHelper` functions from `models.js`.
// Look at the documentation in the `models.js` file for the methods description.
const rootResolvers = {
  Query: {
    activityLogs: (root, args, { adminHelper }) => {
      return adminHelper.loadActivityLogs(args);
    },
    currentUser: (root, args, { user }) => {
      return user;
    },

    publicKeyForUser: (root, args, { user, users }) => {
      return users.publicKeyForUser(user.organization_id, args.email);
    },

    shares: (root, args, { adminHelper }) => {
      return adminHelper.loadShares(args);
    },

    stats: (root, args, { adminHelper }) => {
      return adminHelper.getStatsHelper();
    },

    user: (root, args, { adminHelper }) => {
      return adminHelper.getUser(args.id);
    },

    users: (root, args, { adminHelper }) => {
      return adminHelper.loadUsers();
    },
  },

  Mutation: {
    addActivityLog: async (
      root,
      args,
      { activityLogs, organizations, user }
    ) => {
      const organization = await organizations.get(user.organization_id);
      if (!organization.logging_enabled) {
        throw new UserError('Activity logging is disabled');
      }
      return activityLogs.create({
        ...args.input,
        organization_id: user.organization_id,
        user_id: user.id,
      });
    },

    updateUserConfig: (root, args, { user, users }) => {
      return users.update(user.id, args);
    },

    addCloudStorageProvider: (root, args, { cloudStorageProviders, user }) => {
      return cloudStorageProviders.create({
        ...args.input,
        user_id: user.id,
      });
    },

    deleteCloudStorageProvider: async (
      root,
      args,
      { cloudStorageProviders, user }
    ) => {
      await cloudStorageProviders.deleteByUserAndCspId(user.id, args.csp_id);
      return user;
    },

    updateCspAuthData: (root, args, { cloudStorageProviders, user }) => {
      return cloudStorageProviders.updateCspAuthData({
        ...args,
        user_id: user.id,
      });
    },

    addSyncRule: (root, args, { syncRules, user }) => {
      return syncRules.create({
        ...args,
        user_id: user.id,
      });
    },

    deleteSyncRule: async (root, args, { syncRules, user }) => {
      await syncRules.deleteByUserAndPath(user.id, args.path);
      return user;
    },

    initUserKey: (root, args, { exchangeKeysHelper, user }) => {
      return exchangeKeysHelper.initUserKey(user, args);
    },

    requestDeviceApproval: (root, args, { approvalRequests, user }) => {
      return approvalRequests.updateOrCreate(
        {
          device_id: args.device_id,
          user_id: user.id,
        },
        {
          public_device_key: args.public_device_key,
        }
      );
    },

    approveDevice: (root, args, { exchangeKeysHelper, user }) => {
      return exchangeKeysHelper.approveDevice(user, args);
    },

    declineDevice: async (root, args, { approvalRequests, user }) => {
      const deletedCount = await approvalRequests.deleteWhere({
        device_id: args.device_id,
        public_device_key: args.public_device_key,
        user_id: user.id,
      });
      return deletedCount > 0;
    },

    addShare: async (root, args, { sharesHelper, user }) => {
      return sharesHelper.addShare(args.input, user.organization_id);
    },

    updateShare: (root, args, { shares, user }) => {
      /* eslint-disable camelcase */
      const { storage_type, unique_id, storage_unique_ids, name } = args;
      if (!(storage_unique_ids || name)) {
        throw new Error('storage_unique_ids or name is required');
      }

      // only update non-nullable fields
      const updatedData = {};
      if (storage_unique_ids) {
        updatedData.storage_unique_ids = storage_unique_ids;
      }
      if (name) {
        updatedData.name = name;
      }

      return shares.updateWhere(
        {
          storage_type,
          unique_id,
          organization_id: user.organization_id,
        },
        updatedData
      );
      /* eslint-enable camelcase */
    },

    deleteShare: async (root, args, { shares, user }) => {
      const deletedCount = await shares.deleteWhere({
        ...args,
        organization_id: user.organization_id,
      });
      // true if the share was deleted, false otherwise
      return deletedCount > 0;
    },

    removeUserFromShare: (root, args, { sharesHelper, user }) => {
      return sharesHelper.removeUserFromShare(
        user,
        args.storage_type,
        args.storage_unique_id,
        args.share_unique_id
      );
    },

    initShareKeys: (root, args, { sharesHelper, user }) => {
      return sharesHelper.initShareKeys(args, user);
    },

    addShareKey: (root, args, { sharesHelper, user }) => {
      return sharesHelper.addShareKey(args, user);
    },

    createUser: async (root, args, { adminHelper, organizations, user }) => {
      const newUser = await adminHelper.createUser(args);
      // don't use cache here, because some organization fields
      // could be changed by DB triggers
      const organization = await organizations.get(user.organization_id, {
        useCache: false,
      });
      return {
        organization,
        user: newUser,
      };
    },

    setUserEnabled: (root, args, { adminHelper }) => {
      return adminHelper.setUserEnabled(args.id, args.enable);
    },

    deleteUser: async (root, args, { adminHelper }) => {
      await adminHelper.deleteUser(args.id);
      return args.id;
    },

    setUserRoles: (root, args, { adminHelper }) => {
      return adminHelper.setUserRoles(args.id, args.roles);
    },

    setUserName: (root, args, { adminHelper }) => {
      return adminHelper.setUserName(args.id, args.name);
    },

    resetUserKeys: (root, args, { adminHelper }) => {
      return adminHelper.resetUserKeys(args.id);
    },

    addPolicy: (root, args, { adminHelper }) => {
      return adminHelper.addPolicy(args.input);
    },

    updatePolicy: (root, args, { adminHelper }) => {
      return adminHelper.updatePolicy(args.id, args.input);
    },

    deletePolicy: async (root, args, { adminHelper }) => {
      await adminHelper.deletePolicy(args.id);
      return args.id;
    },

    enableEncryption: (root, args, { adminHelper }) => {
      return adminHelper.enableEncryption(args);
    },

    updateEncryption: (root, args, { adminHelper }) => {
      return adminHelper.updateEncryption(args);
    },

    disableEncryption: (root, args, { adminHelper }) => {
      return adminHelper.disableEncryption();
    },

    addCloudStorageProviderForUser: (root, args, { adminHelper }) => {
      return adminHelper.addCloudStorageProviderForUser(
        args.user_id,
        args.input
      );
    },

    deleteCloudStorageProviderForUser: async (root, args, { adminHelper }) => {
      await adminHelper.deleteCloudStorageProviderForUser(
        args.user_id,
        args.csp_id
      );
      return args.csp_id;
    },

    setLoggingEnabled: (root, args, { adminHelper }) => {
      return adminHelper.setLoggingEnabled(args.enable);
    },

    updateOrganizationContactData: (root, args, { adminHelper }) => {
      return adminHelper.updateOrganizationContactData(args.input);
    },

    updateEnabledStorageTypes: (root, args, { adminHelper }) => {
      return adminHelper.updateEnabledStorageTypes(args.enabled);
    },

    finishAcOnboarding: (root, args, { users, user }) => {
      return users.finishAcOnboarding(user);
    },
  },

  // setup authorization for the following types as public - it's safe here,
  // because they are accessible only by fields with more restricted setup
  ...generatePublicTypes([
    'CspEncryptionSettings',
    'OrganizationEncryptionSettings',
    'Policy',
  ]),

  // setup authorization for the following types as 'owner only'
  ...generateAuthorizedTypes([
    'EncryptedUserKeyData',
    'ShareKey',
    'ApprovalRequest',
  ]),

  ActivityLog: adminOnly({
    schemaObject,
    typeName: 'ActivityLog',
  })({
    user: (activity, args, { users }) => {
      return users.get(activity.user_id);
    },
  }),

  CloudStorageProvider: authorized({
    schemaObject,
    typeName: 'CloudStorageProvider',
    publicFields: ['unique_id', 'user'],
    adminVisibleFields: ['id', 'csp_id', 'display_name', 'type', 'unique_id'],
  })({
    shares: (csp, args, { sharesHelper, user }) => {
      return sharesHelper.findForCsp(csp, user.organization_id);
    },
    user: async (csp, args, { users }) => {
      const userOfCsp = await users.get(csp.user_id);
      return restrictedModelProxy(userOfCsp, [
        'id',
        'email',
        'name',
        'public_key',
      ]);
    },
  }),

  CreateUserPayload: adminOnly({
    schemaObject,
    typeName: 'CreateUserPayload',
  })({}),

  Organization: authorized({
    // actually is a member of
    isOwner: (user, organization) => user.organization_id === organization.id,
    schemaObject,
    typeName: 'Organization',
    adminOnlyFields: [
      'billing_email',
      'billing_phone',
      'has_available_licenses',
      'is_resold',
      'users_count',
      'users_limit',
    ],
  })({
    encryption: organization => {
      // getting list of csp configurations
      const cspSettingsResult = organization.encryption_enabled
        ? organization.encryption_csps_settings
        : [];
      return {
        enabled: organization.encryption_enabled,
        master_key: organization.encryption_master_key,
        encrypt_external_shares: organization.encrypt_external_shares,
        encrypt_public_shares: organization.encrypt_public_shares,
        csps_settings: cspSettingsResult,
      };
    },

    has_available_licenses: organization => {
      return organization.users_limit > organization.users_count;
    },

    is_resold: organization => {
      return !!organization.reseller_id;
    },

    policies: (organization, args, { policies }) => {
      return policies.forOrganization.load(organization.id);
    },
  }),

  Share: allFieldsPublic({
    schemaObject,
    typeName: 'Share',
  })({
    csps: (share, args, { sharesHelper }) => {
      return sharesHelper.findCspsWithShareSafe(share);
    },
    encrypted: async (share, args, { organizations }) => {
      // getting organization
      const organization = await organizations.get(share.organization_id);

      // getting settings for share csp type
      const configForCsp = organization.encryption_csps_settings.find(
        cspSettings => cspSettings.type === share.storage_type
      );

      // making sure storages not there yet default to false
      const isEncryptionEnabledForShare = configForCsp && configForCsp.enabled;

      return (
        !!share.public_share_key &&
        organization.encryption_enabled &&
        isEncryptionEnabledForShare
      );
    },
    has_external_users: (share, args, { sharesHelper }) => {
      return sharesHelper.hasExternalUsers(share);
    },
    users_without_share_key: (share, args, { sharesHelper }) => {
      return sharesHelper.usersWithoutShareKeys(share);
    },
    share_key_for_current_user: (share, args, { shareKeys, user }) => {
      return shareKeys.getByShareAndUser(share, user);
    },
    users: (share, args, { sharesHelper }) => {
      return sharesHelper.usersWithShare(share);
    },
  }),

  SyncRule: authorized({
    schemaObject,
    typeName: 'SyncRule',
    adminVisibleFields: ['id', 'path', 'csp_ids'],
  })({}),

  User: authorized({
    publicFields: ['id', 'email', 'name', 'public_key'],
    adminVisibleFields: [
      'is_enabled',
      'csps',
      'is_resellers_admin',
      'last_request_ip',
      'last_request_time',
      'roles',
      'sync_rules',
    ],
    isOwner: (currentUser, checkedUser) => currentUser.id === checkedUser.id,
    schemaObject,
    typeName: 'User',
  })({
    csps: (user, args, { cloudStorageProviders }) => {
      return cloudStorageProviders.forUser.load(user.id);
    },
    organization: (user, args, { organizations }) => {
      return organizations.get(user.organization_id);
    },
    sync_rules: (user, args, { syncRules }) => {
      return syncRules.forUser.load(user.id);
    },
    encrypted_user_keys: (user, args, { encryptedUserKeyData }) => {
      return encryptedUserKeyData.forUser.load(user.id);
    },
    approval_requests: (user, args, { approvalRequests }) => {
      return approvalRequests.forUser.load(user.id);
    },
    enabled_storage_types: (user, args, { organizations }) => {
      return organizations.getEnabledStorageTypes(user.organization_id);
    },
  }),
};

// Allow to use Date and JSON scalar types in the schema
const customScalars = {
  Date: GraphQLDate,
  JSON: GraphQLJSON,
};

const executableSchema = makeExecutableSchema({
  typeDefs: schema,

  resolvers: {
    ...rootResolvers,
    ...customScalars,
  },
});

ensureAuthorizationSetup(executableSchema);

export default executableSchema;
