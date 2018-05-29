import knex from 'knex';

import {
  createAdminHelper,
  createModels,
  createResellersHelper,
  createResellersModels,
} from '../models';
import { createSampleEntities } from '../utils/testutils';
import knexSettings from '../utils/knexSettings';

// WARNING: don't use directly in tests (use `transaction` instead)
let knexInstance;
let transaction;
let models;

// sample entities
let firstOrganization;
let secondOrganization;
let userWithoutAdminRights;
let userWithoutPublicKey;
let userWithAdminRights;
let userFromDifferentOrganization;
// the same as userWithoutAdminRights
let sampleUser;

const SAMPLE_MASTER_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA2n6lfou6V3bmRcQPuHCC
X8acgMjjYiixtRfpb7VSvIH0kai3mMKk/E60w3tiQvphpXIdXcqduogH3XTb03Ys
a1gk1xBTcrfh+f0+OxT/D3OcLe/EcdaZo7YMYg/rRsDz0HmC8B6VeiXDrRvo7hlL
H7b9CVV1P7t+fJ66IzkyrG94vLEWKgqElrm6VJe87K2nzFD7aQbeIC3wptkpjNJh
CReX8uu5pnJ5WsDGT2WMdaJixkAgm6BcnRGEGGjT8+7WgWI5UZKN0Sf2GouE9DPt
cLh07M5bmpzJdrbzvD66ewt5hWphUfXvdmgU1WdynXMfdn6PIcI0m1bVdbqfcrFC
XV0LNLBGf+8zbrGY1ftGrvpkgQKtj5KGkqj2Kyit3O8rTn0X3rMeYMzYbWuiiwQC
O8Q980LkO6gyxNlPaybHQYs6/Xr5k8/bCl6Kkk/ktZIRTfkEilMhC6Dtw8qMx0Qg
QM/lYkBFqC5Ox2wzpsNqLtzvwdrl/g5/i7ZrGxI6bTOf7rNHa/VkIrZeVMZkCdsR
v9+1dXa2JOMJQkU7khEBOgqIPkjSdiu0DHUwYoI6+mumKKP54eULTJQLCacyJUrC
Wvz9teGWptkZ48LKa7huP0R+XKAYnKE1XkFRXndV5N5MD+d+DhuKxcbaUqj9Q5sh
5WeFTQl1LiOCylyAuuQZ7hMCAwEAAQ==
-----END PUBLIC KEY-----`;

const SAMPLE_SHARE_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA1r4AGEddSWn4/HRj4prF
4GCgW8JOE+W5TTEQYkjf3n8t5N67ACInUMAG2WZtoTKy41BpEJZSfaILfooXm40v
XSnKuVLYBll2JJ6dEHT1sH+PMpyFfqzs7XvwWcvE98nAcwtKv2fH0HSx2qoBPv2n
iM/pBJbnHY1oDggWSdC15gF+weT0egsO3KapFGaHREjauPaUsFIx/m9QM+idS6Aw
4KEViQ+F+9PrXDT7lKyaeXQ60g4uZgNIUYE/DYfjCpmlZ9JEh21PYccipGuvfNm8
M45OpkPeYlFvXhPekNXUVT18udRDzuRFiJSa9TKl6UMi+3eLgdvv3nKJdR8ynILX
MJZ5WhTYX6JTGbCl56uWXHAVXuDuoREewd82Kfrz5hMouybuuDy/xN02UZSm8jn8
O8M5xl69MITzzM4oxrqnRUKCDXnjyYZ7GwhOj+C5qQLCPtlhObaVBsP4+e3NY31B
FoRyA7dDdAudR9gN0agUv9FGWacnyQYKGyCEFsyqGVrnuhSRiO0dw3cRBCh5des4
cKweELFYJvj4sCQ2SXk69231S3O9PkoyVTudN473VU0JBM+YmB7sOXSgNMFei+Bv
K+uUrl4xRM3k6IbV8MeO+r+FZuZOxfArmts7EP9Mys/zvWCaSG2+d9UGunWuntvO
rI71jFE5lQG4PIY0yPEkuvMCAwEAAQ==
-----END PUBLIC KEY-----`;

const initUserKeyData = {
  public_user_key: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE1kXIF/RmjaPNrueVT9HP6qaHy2Pn9WUZ
0fL8bTjTxGFxMn+1bIHWYe5DMhBluKmYPYqqVk1xK5Qd93tk0fZRPQ==
-----END PUBLIC KEY-----`,
  public_device_key: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEOlKvtVqN/XtLrBBXMzrzbLAVbW4hzWxs
gDrYiEz5LR6Ly9Tq3/5NJ11bOejHE0G92+2MlcBMJk3DpEG5ueEYUA==
-----END PUBLIC KEY-----`,
  device_id: 'irGzdl0axfVgzaSblpJlxuueRLFoKwIw',
  encrypted_user_key:
    'uyrLO6Ix9NB3RSWPm4gmfCXgdVX1nQgtGKuodbrqRpeCsLiMUvKhFBDwEhXAD4Un',
};

const dropboxCspBase = {
  display_name: 'Dropbox 0',
  type: 'dropbox',
  unique_id: 'crosscloud.cloudtest@gmail.com',
  csp_id: 'dropbox_crosscloud.cloudtest@gmail.com',
};

const sampleShareData = {
  name: 'Test share',
  storage_type: 'dropbox',
  unique_id: 'share_abcdef',
  storage_unique_ids: ['crosscloud.cloudtest@gmail.com'],
};

beforeEach(async () => {
  knexInstance = knex(knexSettings);
  await new Promise((resolve, reject) => {
    knexInstance
      .transaction(trx => {
        // WARNING: don't use async/await in this callback (or return a promise)
        // or the transaction will be automatically commited
        transaction = trx;
        models = createModels({ knex: transaction });
        resolve();
      })
      .catch(reject);
  });

  ({
    firstOrganization,
    secondOrganization,
    userWithoutAdminRights,
    userWithoutPublicKey,
    userWithAdminRights,
    userFromDifferentOrganization,
  } = await createSampleEntities(models));
  sampleUser = userWithoutAdminRights;
});

afterEach(async () => {
  await transaction.rollback();
  await knexInstance.destroy();
});

describe('CloudStorageProviders', () => {
  let dropboxCsp;

  beforeEach(async () => {
    dropboxCsp = await models.cloudStorageProviders.create({
      ...dropboxCspBase,
      authentication_data: 'some auth data',
      user_id: userWithoutAdminRights.id,
    });
  });

  describe('#updateCspAuthData', () => {
    it('should throw if `old_authentication_data` is different than the one in database', async () => {
      expect.assertions(1);

      try {
        await models.cloudStorageProviders.updateCspAuthData({
          user_id: userWithoutAdminRights.id,
          csp_id: dropboxCsp.csp_id,
          old_authentication_data: 'different auth data',
          new_authentication_data: 'new auth data',
        });
      } catch (error) {
        expect(error.message).toBe(
          'old_authentication_data is different than authentication_data in the database'
        );
      }
    });
  });
});

describe('Organizations', async () => {
  describe('checkIfNameAvailable', () => {
    it('should return `false` if the name is not available', async () => {
      const available = await models.organizations.checkIfNameAvailable(
        firstOrganization.display_name
      );
      expect(available).toBe(false);
    });

    it('should return `true` if the name is not available but `ignoredId` option was used', async () => {
      const available = await models.organizations.checkIfNameAvailable(
        firstOrganization.display_name,
        { ignoredId: firstOrganization.id }
      );
      expect(available).toBe(true);
    });

    it('should return `false` if the name is not available and `ignoredId` for different org was used', async () => {
      const available = await models.organizations.checkIfNameAvailable(
        firstOrganization.display_name,
        { ignoredId: secondOrganization.id }
      );
      expect(available).toBe(false);
    });

    it('should return `true` if the name is available', async () => {
      const available = await models.organizations.checkIfNameAvailable(
        'some-name-not-used-anywhere'
      );
      expect(available).toBe(true);
    });
  });

  describe('getEnabledStorageTypes', () => {
    it('should return an empty list if not enabled types set explicitly', async () => {
      const enabledTypes = await models.organizations.getEnabledStorageTypes(
        firstOrganization.id
      );
      await expect(enabledTypes).toMatchSnapshot();
    });

    it('should return a correct list if enabled types set explicitly', async () => {
      await models.organizations.update(firstOrganization.id, {
        enabled_storage_types: ['box', 'dropbox'],
      });
      const enabledTypes = await models.organizations.getEnabledStorageTypes(
        firstOrganization.id
      );
      await expect(enabledTypes).toEqual(['box', 'dropbox']);
    });
  });
});

describe('Users', () => {
  describe('#checkIfEmailAvailable', () => {
    it('should return `false` if email is not available', async () => {
      const available = await models.users.checkIfEmailAvailable(
        userWithoutAdminRights.email
      );
      expect(available).toBe(false);
    });

    it('should return `true` if email is available', async () => {
      const available = await models.users.checkIfEmailAvailable(
        'some-email-not-used-anywhere@example.com'
      );
      expect(available).toBe(true);
    });
  });

  describe('#publicKeyForUser', () => {
    it('should return a public key for a user', async () => {
      const publicKey = await models.users.publicKeyForUser(
        firstOrganization.id,
        userWithoutAdminRights.email
      );
      expect(publicKey).toBe(userWithoutAdminRights.public_key);
    });

    it("should return null if a user doesn't have a public key", async () => {
      const publicKey = await models.users.publicKeyForUser(
        firstOrganization.id,
        userWithAdminRights.email
      );
      expect(publicKey).toBe(null);
    });

    it('should return null if a user belongs to a different organization', async () => {
      const publicKey = await models.users.publicKeyForUser(
        firstOrganization.id,
        userFromDifferentOrganization.email
      );
      expect(publicKey).toBe(null);
    });
  });

  describe('#deleteUser', () => {
    it('should delete the user instance and save its data in the `deleted_users` table', async () => {
      await models.users.deleteUser({
        id: sampleUser.id,
        organization_id: sampleUser.organization_id,
      });

      const checkedUser = await transaction('users')
        .where({
          id: sampleUser.id,
        })
        .first();
      expect(checkedUser).toBe(undefined);

      const deletedUser = await transaction('deleted_users')
        .where({
          id: sampleUser.id,
        })
        .first();
      expect(deletedUser.id).toBe(sampleUser.id);
      expect(deletedUser.name).toBe(sampleUser.name);
    });
  });

  describe('#finishAcOnboarding', () => {
    it('should save that the user closed the admin console onboarding dialog', async () => {
      expect(userWithAdminRights.ac_onboarding_finished).toBe(false);
      const updatedUser = await models.users.finishAcOnboarding(
        userWithAdminRights
      );
      expect(updatedUser.ac_onboarding_finished).toBe(true);
    });

    it('should throw if run for a user without admin rights', async () => {
      expect.assertions(1);
      try {
        await models.users.finishAcOnboarding(userWithoutAdminRights);
      } catch (error) {
        expect(error.message).toBe('Not administrator');
      }
    });
  });
});

describe('SharesHelper', () => {
  let dropboxCsp;
  let share1;
  let share2;
  let initShareKeysData;

  beforeEach(async () => {
    dropboxCsp = await models.cloudStorageProviders.create({
      ...dropboxCspBase,
      user_id: userWithoutAdminRights.id,
    });

    // dropboxCspForUser2
    await models.cloudStorageProviders.create({
      ...dropboxCspBase,
      user_id: userWithAdminRights.id,
    });

    // onedriveCsp
    await models.cloudStorageProviders.create({
      user_id: userWithoutAdminRights.id,
      display_name: 'Onedrive 0',
      type: 'onedrive',
      unique_id: 'abcdefgh',
      csp_id: 'onedrive_abcdefgh',
    });

    // onedriveCspFromSecondOrg
    await models.cloudStorageProviders.create({
      user_id: userFromDifferentOrganization.id,
      display_name: 'Onedrive 0',
      type: 'onedrive',
      unique_id: 'second_org_arg_csp_uid',
      csp_id: 'onedrive_second_org_arg_csp_uid',
    });

    share1 = await models.shares.create({
      organization_id: firstOrganization.id,
      ...sampleShareData,
    });

    share2 = await models.shares.create({
      organization_id: secondOrganization.id,
      name: 'Second share',
      storage_type: 'onedrive',
      unique_id: 'share_second',
      storage_unique_ids: ['second_org_arg_csp_uid'],
    });

    initShareKeysData = {
      storage_type: 'dropbox',
      share_unique_id: 'share_abcdef',
      public_share_key: SAMPLE_SHARE_KEY,
      encrypted_share_keys: [
        {
          user_id: userWithoutAdminRights.id,
          encrypted_share_key: 'sample encrypted data',
        },
        {
          user_id: userWithAdminRights.id,
          encrypted_share_key: 'sample encrypted data 2',
        },
      ],
    };
  });

  describe('#findForCsp', () => {
    it('should find shares by given CSP and organization id', async () => {
      const filteredShares = await models.sharesHelper.findForCsp(
        dropboxCsp,
        firstOrganization.id
      );
      expect(filteredShares).toEqual([share1]);
      const filteredSharesFromOtherOrg = await models.sharesHelper.findForCsp(
        dropboxCsp,
        secondOrganization.id
      );
      expect(filteredSharesFromOtherOrg).toEqual([]);
    });
  });

  describe('#hasExternalUsers', () => {
    it("should return `false` if the share hasn't external users", async () => {
      const result = await models.sharesHelper.hasExternalUsers(share1);
      expect(result).toBe(false);
    });

    it('should return `true` if the share has external users', async () => {
      const shareWithExternalUser = await models.shares.create({
        organization_id: firstOrganization.id,
        name: 'Test share 2',
        storage_type: 'dropbox',
        unique_id: 'share_with_external',
        storage_unique_ids: [
          'crosscloud.cloudtest@gmail.com',
          'external@example.com',
        ],
      });
      const result = await models.sharesHelper.hasExternalUsers(
        shareWithExternalUser
      );
      expect(result).toBe(true);
    });
  });

  describe('#initShareKeys', () => {
    it('should setup a public key of the share and encrypted private keys', async () => {
      const share = await models.sharesHelper.initShareKeys(
        initShareKeysData,
        userWithoutAdminRights
      );

      expect(share.public_share_key).toBe(SAMPLE_SHARE_KEY);

      const shareKey1 = await models.shareKeys.getByShareAndUser(
        share,
        userWithoutAdminRights
      );
      expect(shareKey1.encrypted_share_key).toBe('sample encrypted data');

      const shareKey2 = await models.shareKeys.getByShareAndUser(
        share,
        userWithAdminRights
      );
      expect(shareKey2.encrypted_share_key).toBe('sample encrypted data 2');
    });

    it('should fail if the share has the public key already set up', async () => {
      expect.assertions(1);
      await models.sharesHelper.initShareKeys(
        initShareKeysData,
        userWithoutAdminRights
      );

      try {
        await models.sharesHelper.initShareKeys(
          initShareKeysData,
          userWithoutAdminRights
        );
      } catch (error) {
        expect(error.message).toBe(
          'The share has the public key already set up'
        );
      }
    });

    it('should fail if the user is not a member of the share', async () => {
      expect.assertions(1);

      try {
        await models.sharesHelper.initShareKeys(
          initShareKeysData,
          userWithoutPublicKey
        );
      } catch (error) {
        expect(error.message).toBe("You don't belong to the share");
      }
    });

    it('should fail if the user is not a member of the organization', async () => {
      expect.assertions(1);

      try {
        await models.sharesHelper.initShareKeys(
          initShareKeysData,
          userFromDifferentOrganization
        );
      } catch (error) {
        expect(error.message).toBe('Cannot find the share');
      }
    });

    it('should fail if it has a key for a user which is not a member of the share', async () => {
      expect.assertions(1);

      try {
        await models.sharesHelper.initShareKeys(
          {
            ...initShareKeysData,
            encrypted_share_keys: [
              ...initShareKeysData.encrypted_share_keys,
              {
                user_id: userWithoutPublicKey.id,
                encrypted_share_key: 'sample encrypted data 3',
              },
            ],
          },
          userWithoutAdminRights
        );
      } catch (error) {
        expect(error.message).toBe(
          `User with id ${userWithoutPublicKey.id} doesn't belong to the share`
        );
      }
    });
  });

  describe('#usersWithShare', () => {
    it('should find users having the share', async () => {
      const users = await models.sharesHelper.usersWithShare(share2);
      // TODO: Replace returning whitelist proxy here with schema level
      // authorization
      expect(users.map(user => user.id)).toEqual([
        userFromDifferentOrganization.id,
      ]);
    });

    it('should find users having the share even if they have the same cloud account', async () => {
      const users = await models.sharesHelper.usersWithShare(share1);
      // TODO: Replace returning whitelist proxy here with schema level
      // authorization
      expect(users.map(user => user.id)).toEqual([
        userWithoutAdminRights.id,
        userWithAdminRights.id,
      ]);
    });
  });

  describe('#usersWithoutShareKeys', () => {
    it("should return a list of members of the share which don't have a share key", async () => {
      await models.sharesHelper.initShareKeys(
        {
          ...initShareKeysData,
          encrypted_share_keys: [initShareKeysData.encrypted_share_keys[0]],
        },
        userWithoutAdminRights
      );

      const usersWithoutShareKeys = await models.sharesHelper.usersWithoutShareKeys(
        share1
      );
      expect(usersWithoutShareKeys.length).toBe(1);
      expect(usersWithoutShareKeys[0].id).toBe(userWithAdminRights.id);
    });
  });
});

describe('ExchangeKeysHelper', () => {
  describe('#initUserKey', () => {
    it('should throw if invoked for a user with a public key', async () => {
      expect(() => {
        models.exchangeKeysHelper.initUserKey(sampleUser, initUserKeyData);
      }).toThrowError(/The public key is already set/);
    });

    it('should set a public key for the user', async () => {
      await models.exchangeKeysHelper.initUserKey(
        userWithoutPublicKey,
        initUserKeyData
      );
      const updatedUser = await models.users.get(userWithoutPublicKey.id);
      expect(updatedUser.public_key).toBe(initUserKeyData.public_user_key);
    });
  });

  describe('#approveDevice', async () => {
    let testUser;

    // don't set user_id here because isn't available yet
    const baseApprovalRequest = {
      device_id: 'qXLEzB7srerGsUhArWfDbIErWCKxToFp',
      public_device_key: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEGLkO/XieDlYAMINvAD0Umts7+j6cX6q0
KeDejr1PCAaDOuEzWY0XwoCt9NImHveAJKU+fAh8G/EWPXjWYg1Cvg==
-----END PUBLIC KEY-----`,
    };

    const approvalData = {
      public_device_key: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEGLkO/XieDlYAMINvAD0Umts7+j6cX6q0
KeDejr1PCAaDOuEzWY0XwoCt9NImHveAJKU+fAh8G/EWPXjWYg1Cvg==
-----END PUBLIC KEY-----`,
      device_id: 'qXLEzB7srerGsUhArWfDbIErWCKxToFp',
      encrypted_user_key:
        'e1v84MJ1q2vSP2XEzIbyuLhfq1ovRXRpwP38EmfHJrI9fKarAITpu5oV67KjYfwm',
    };

    beforeEach(async () => {
      testUser = userWithoutPublicKey;
      await models.exchangeKeysHelper.initUserKey(testUser, initUserKeyData);
    });

    it('should throw if there is no approval request available', async () => {
      expect.assertions(1);
      try {
        await models.exchangeKeysHelper.approveDevice(testUser, approvalData);
      } catch (error) {
        expect(error.message).toEqual('Cannot find the approval request');
      }
    });

    it("should throw if the data in the approval request doesn't match the one in approval ", async () => {
      expect.assertions(1);
      await models.approvalRequests.create({
        user_id: testUser.id,
        device_id: 'qXLEzB7srerGsUhArWfDbIErWCKxToFp',
        // the public device key doesn't match
        public_device_key: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEkD6Vrbuy3mdV4a2xS/VdnaXMmUxMu38y
vQ2WJpIZi4vu5ZVnphCto2naGmuuNfSqT64Nb50LTRB46KGAiCkPlg==
-----END PUBLIC KEY-----`,
      });

      try {
        await models.exchangeKeysHelper.approveDevice(testUser, approvalData);
      } catch (error) {
        expect(error.message).toEqual('Cannot find the approval request');
      }
    });

    it('should add encrypted user key data', async () => {
      await models.approvalRequests.create({
        ...baseApprovalRequest,
        user_id: testUser.id,
      });
      await models.exchangeKeysHelper.approveDevice(testUser, approvalData);

      const encryptedUserKeyData = await models.encryptedUserKeyData
        .getTable()
        .where({
          device_id: 'qXLEzB7srerGsUhArWfDbIErWCKxToFp',
        });
      expect(encryptedUserKeyData.length).toBe(1);
      expect(encryptedUserKeyData[0].device_id).toBe(approvalData.device_id);
      expect(encryptedUserKeyData[0].public_device_key).toBe(
        approvalData.public_device_key
      );
    });

    it('should throw if invoked more than once', async () => {
      await models.approvalRequests.create({
        ...baseApprovalRequest,
        user_id: testUser.id,
      });
      await models.exchangeKeysHelper.approveDevice(testUser, approvalData);
      try {
        await models.exchangeKeysHelper.approveDevice(testUser, approvalData);
      } catch (error) {
        expect(error.message).toEqual('Cannot find the approval request');
      }
    });
  });
});

describe('createAdminHelper', () => {
  it("should return a fake proxy if the user doesn't have admin rights", () => {
    const adminHelper = createAdminHelper(
      transaction,
      userWithoutAdminRights,
      models
    );
    expect(() => {
      adminHelper.loadUsers();
    }).toThrowError(/Administrator rights required to perform this action/);
  });

  it('should return a working proxy if the user has admin rights', async () => {
    const adminHelper = createAdminHelper(
      transaction,
      userWithAdminRights,
      models
    );
    const result = await adminHelper.loadUsers();
    expect(result).toEqual([
      userWithAdminRights,
      userWithoutAdminRights,
      userWithoutPublicKey,
    ]);
  });
});

describe('RegistrationHelper', () => {
  describe('#register', () => {
    it('should create a new user and organization', async () => {
      await models.registrationHelper.register({
        email: 'newly-registered@example.com',
        password: 'some-password',
        user_name: 'John Smith',
        company_name: 'The New Company',
      });
      const user = await models.users.getByEmail(
        'newly-registered@example.com'
      );
      expect(user.name).toBe('John Smith');
      const organization = await models.organizations.get(user.organization_id);
      expect(organization.display_name).toBe('The New Company');
      expect(user.roles).toEqual(['administrator', 'user']);
    });
  });
});

describe('AdminHelper', () => {
  let adminHelper;

  const SAMPLE_ENCRYPTION_SETTINGS = {
    master_key: SAMPLE_MASTER_KEY,
    encrypt_external_shares: true,
    encrypt_public_shares: true,
    csps_settings: [
      {
        type: 'dropbox',
        enabled: true,
      },
      {
        type: 'gdrive',
        enabled: false,
      },
    ],
  };

  beforeEach(() => {
    adminHelper = createAdminHelper(transaction, userWithAdminRights, models);
  });

  describe('#addPolicy', () => {
    it('should not allow to add an unsupported policy', async () => {
      expect.assertions(1);
      try {
        await adminHelper.addPolicy({
          is_enabled: true,
          name: 'sample mime type policy',
          type: 'a_new_type',
          criteria: 'sample criteria',
        });
      } catch (error) {
        expect(error.message).toBe('Unsupported policy type: a_new_type');
      }
    });

    it('should not allow to add a prohibited extensions policy with incorrect chars', async () => {
      expect.assertions(1);
      try {
        await adminHelper.addPolicy({
          is_enabled: true,
          name: 'sample policy',
          type: 'fileextension',
          criteria: 'ex..t',
        });
      } catch (error) {
        expect(error.message).toBe('Extension contains invalid character: .');
      }
    });

    it('should allow to add a correct prohibited extensions policy', async () => {
      await adminHelper.addPolicy({
        is_enabled: true,
        name: 'sample policy',
        type: 'fileextension',
        criteria: 'exe',
      });
      const policies = await models.policies.forOrganization.load(
        firstOrganization.id
      );
      expect(policies.length).toBe(1);
      expect(policies[0].name).toBe('sample policy');
      expect(policies[0].type).toBe('fileextension');
      expect(policies[0].criteria).toBe('exe');
      expect(policies[0].is_enabled).toBe(true);
    });

    it('should not allow to add an incorrect mime types policy', async () => {
      expect.assertions(1);
      try {
        await adminHelper.addPolicy({
          is_enabled: true,
          name: 'sample mime type policy',
          type: 'mimetype',
          criteria: 'application/incorrect-mime-type',
        });
      } catch (error) {
        expect(error.message).toBe(
          'Incorrect mime type: application/incorrect-mime-type'
        );
      }
    });

    it('should allow to add a correct mime type policy', async () => {
      await adminHelper.addPolicy({
        is_enabled: true,
        name: 'sample mime type policy',
        type: 'mimetype',
        criteria:
          'application/vnd.microsoft.portable-executable,application/x-shockwave-flash',
      });
      const policies = await models.policies.forOrganization.load(
        firstOrganization.id
      );
      expect(policies.length).toBe(1);
      expect(policies[0].name).toBe('sample mime type policy');
      expect(policies[0].type).toBe('mimetype');
      expect(policies[0].criteria).toBe(
        'application/vnd.microsoft.portable-executable,application/x-shockwave-flash'
      );
      expect(policies[0].is_enabled).toBe(true);
    });
  });

  describe('#createUser', () => {
    it('should create a user and verify that it has the role "user" but not "administrator"', async () => {
      const user = await adminHelper.createUser({
        name: 'Test User',
        email: 'test@company.com',
      });

      expect(user.roles).toContain('user');
      expect(user.roles).not.toContain('administrator');
    });
  });

  describe('#deleteUser', () => {
    it('should not allow an admin to delete himself', async () => {
      expect.assertions(1);
      try {
        await adminHelper.deleteUser(userWithAdminRights.id);
      } catch (error) {
        expect(error.message).toBe('You cannot delete yourself');
      }
    });
  });

  describe('#enableEncryption', () => {
    it('should throw if the master key has incorrect format', async () => {
      expect.assertions(1);
      try {
        await adminHelper.enableEncryption({
          ...SAMPLE_ENCRYPTION_SETTINGS,
          master_key: 'sample key in incorrect format',
        });
      } catch (error) {
        expect(error.message).toBe('The master_key has an incorrect format');
      }
    });
    it('should enable encryption in the organization', async () => {
      await adminHelper.enableEncryption(SAMPLE_ENCRYPTION_SETTINGS);
      const organization = await models.organizations.get(
        userWithAdminRights.organization_id
      );
      expect(organization.encryption_enabled).toBe(true);
      expect(organization.encryption_master_key).toBe(SAMPLE_MASTER_KEY);
      expect(organization.encrypt_external_shares).toBe(true);
      expect(organization.encrypt_public_shares).toBe(true);
      expect(organization.encryption_csps_settings).toEqual([
        {
          type: 'dropbox',
          enabled: true,
        },
        {
          type: 'gdrive',
          enabled: false,
        },
      ]);
    });
  });

  describe('resetUserKeys', () => {
    beforeEach(async () => {
      await models.exchangeKeysHelper.initUserKey(
        userWithoutPublicKey,
        initUserKeyData
      );
    });

    it('should reset the user keys', async () => {
      const updatedUser = await adminHelper.resetUserKeys(
        userWithoutPublicKey.id
      );
      expect(updatedUser.public_key).toBe(null);
      const encryptedUserKeyData = await models.encryptedUserKeyData.forUser.load(
        userWithoutPublicKey.id
      );
      expect(encryptedUserKeyData).toEqual([]);
    });

    it('should remove shared keys of the user', async () => {
      await models.cloudStorageProviders.create({
        ...dropboxCspBase,
        user_id: userWithoutPublicKey.id,
      });

      await models.cloudStorageProviders.create({
        ...dropboxCspBase,
        user_id: userWithAdminRights.id,
      });

      const share = await models.shares.create({
        organization_id: firstOrganization.id,
        ...sampleShareData,
      });

      const initShareKeysData = {
        storage_type: 'dropbox',
        share_unique_id: 'share_abcdef',
        public_share_key: SAMPLE_SHARE_KEY,
        encrypted_share_keys: [
          {
            user_id: userWithoutPublicKey.id,
            encrypted_share_key: 'sample encrypted data',
          },
          {
            user_id: userWithAdminRights.id,
            encrypted_share_key: 'sample encrypted data 2',
          },
        ],
      };

      await models.sharesHelper.initShareKeys(
        initShareKeysData,
        userWithoutPublicKey
      );

      await adminHelper.resetUserKeys(userWithoutPublicKey.id);

      const usersWithoutShareKeys = await models.sharesHelper.usersWithoutShareKeys(
        share
      );
      expect(usersWithoutShareKeys.length).toBe(1);
      expect(usersWithoutShareKeys[0].id).toBe(userWithoutPublicKey.id);
    });
  });

  describe('setUserEnabled', () => {
    it('should not allow an admin to disable himself', async () => {
      expect.assertions(1);
      try {
        await adminHelper.setUserEnabled(userWithAdminRights.id, false);
      } catch (error) {
        expect(error.message).toBe('You cannot disable yourself');
      }
    });
  });

  describe('#updateEnabledStorageTypes', () => {
    it('should correctly update storage types for an organization', async () => {
      await adminHelper.updateEnabledStorageTypes(['box', 'dropbox']);
      const updatedOrganization = await models.organizations.get(
        firstOrganization.id
      );
      expect(updatedOrganization.enabled_storage_types).toEqual([
        'box',
        'dropbox',
      ]);
    });
  });

  describe('#updateEncryption', () => {
    it("should throw if the encryption isn't enabled in the organization", async () => {
      expect.assertions(1);

      try {
        await adminHelper.updateEncryption({
          encrypt_external_shares: false,
          encrypt_public_shares: false,
          csps_settings: [
            {
              type: 'dropbox',
              enabled: false,
            },
            {
              type: 'gdrive',
              enabled: true,
            },
          ],
        });
      } catch (error) {
        expect(error.message).toBe(
          'Encryption is not enabled for the organization'
        );
      }
    });

    it('should update encryption settings', async () => {
      await adminHelper.enableEncryption(SAMPLE_ENCRYPTION_SETTINGS);
      await adminHelper.updateEncryption({
        encrypt_external_shares: false,
        // encrypt_public_shares: false,
        csps_settings: [
          {
            type: 'dropbox',
            enabled: false,
          },
          {
            type: 'gdrive',
            enabled: true,
          },
        ],
      });

      // force clear dataloader's cache
      models.organizations.byId.clearAll();

      const organization = await models.organizations.get(
        userWithAdminRights.organization_id
      );
      expect(organization.encryption_enabled).toBe(true);
      expect(organization.encryption_master_key).toBe(SAMPLE_MASTER_KEY);
      expect(organization.encrypt_external_shares).toBe(false);
      // expect(organization.encrypt_public_shares).toBe(false);
      expect(organization.encryption_csps_settings).toEqual([
        {
          type: 'dropbox',
          enabled: false,
        },
        {
          type: 'gdrive',
          enabled: true,
        },
      ]);
    });
  });

  describe('#updateOrganizationContactData', () => {
    it('should throw if the data are incorrect', async () => {
      expect.assertions(1);
      try {
        await adminHelper.updateOrganizationContactData({});
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  it('should update the organization contact data', async () => {
    await adminHelper.updateOrganizationContactData({
      display_name: 'A new name',
      admin_phone: '123456',
      admin_email: 'admin@company.com',
      billing_phone: '654321',
      billing_email: 'billing@company.com',
    });
    const organization = await models.organizations.get(firstOrganization.id);
    expect(organization.display_name).toBe('A new name');
    expect(organization.admin_phone).toBe('123456');
    expect(organization.admin_email).toBe('admin@company.com');
    expect(organization.billing_phone).toBe('654321');
    expect(organization.billing_email).toBe('billing@company.com');
  });
});

describe('ResellersHelper', () => {
  let providerId;
  let resellersHelper;

  beforeEach(async () => {
    const [providerData] = await transaction('resellers_providers')
      .insert({
        name: 'test_reseller',
      })
      .returning('*');
    providerId = providerData.id;
    const resellersModels = createResellersModels({ knex: transaction });
    resellersHelper = createResellersHelper({
      knex: transaction,
      models: resellersModels,
      providerId,
    });
  });

  const createSampleOrganization = reseller => {
    return resellersHelper.createOrganization({
      reseller_id: reseller.id,
      company_name: 'Test company',
      admin_email: 'me@example.com',
      users_limit: 20,
    });
  };

  describe('#createReseller', () => {
    it('should create a new reseller with a correct provider id', async () => {
      const reseller = await resellersHelper.createReseller();
      expect(reseller).toBeTruthy();
      expect(reseller.provider_id).toBe(providerId);
    });
  });

  describe('#deleteReseller', () => {
    it('should throw for a non-existent reseller', async () => {
      expect.assertions(1);

      try {
        // invoke with random uuid
        await resellersHelper.deleteReseller(
          '3c848c09-ff15-4083-96ba-0d4b4b339ad2'
        );
      } catch (error) {
        expect(error.message).toBe(
          'Non-existing reseller or created by a different provider'
        );
      }
    });

    it('should throw for a reseller created by a different provider', async () => {
      expect.assertions(1);

      const reseller = await resellersHelper.createReseller();
      const [secondProvider] = await transaction('resellers_providers')
        .insert({
          name: 'second provider',
        })
        .returning('*');

      const secondResellersModels = createResellersModels({
        knex: transaction,
      });
      const secondResellersHelper = createResellersHelper({
        knex: transaction,
        models: secondResellersModels,
        providerId: secondProvider.id,
      });

      try {
        // invoke with random uuid
        await secondResellersHelper.deleteReseller(reseller.id);
      } catch (error) {
        expect(error.message).toBe(
          'Non-existing reseller or created by a different provider'
        );
      }
    });

    it('should delete a reseller if created by the current provider', async () => {
      const reseller = await resellersHelper.createReseller();
      await resellersHelper.deleteReseller(reseller.id);

      const [
        result,
      ] = await resellersHelper.models.resellers.getTable().count();
      // NOTE: result of the `count` query in Postgres is transmitted as a string
      expect(result.count).toBe('0');
    });
  });

  describe('#createOrganization', () => {
    let reseller;

    beforeEach(async () => {
      reseller = await resellersHelper.createReseller();
    });

    it('should create a new organization and a superuser', async () => {
      const organization = await createSampleOrganization(reseller);
      expect(organization).toBeTruthy();
      expect(organization.reseller_id).toBe(reseller.id);

      // a super user shouldn't be counted as a licensed user
      expect(organization.users_count).toBe(0);

      const superuser = await models.users
        .getTable()
        .where({ organization_id: organization.id })
        .first();
      expect(superuser).toBeTruthy();
      expect(superuser.is_resellers_admin).toBe(true);
      expect(superuser.roles).toEqual(['administrator']);
    });
  });

  describe('#getOrganizationOrThrow', () => {
    it('should throw if the organization is not existent', async () => {
      expect.assertions(1);

      try {
        // invoke with random uuids
        await resellersHelper.getOrganizationOrThrow(
          '3c848c09-ff15-4083-96ba-0d4b4b339ad2',
          '85354e69-da36-4299-b99f-1a132f431281'
        );
      } catch (error) {
        expect(error.message).toBe(
          'Non-existing organization or created by a different reseller'
        );
      }
    });

    it('should throw if the organization was not created by the current provider', async () => {
      expect.assertions(1);

      const reseller = await resellersHelper.createReseller();
      try {
        await resellersHelper.getOrganizationOrThrow(
          reseller.id,
          // random uuid
          '85354e69-da36-4299-b99f-1a132f431281'
        );
      } catch (error) {
        expect(error.message).toBe(
          'Non-existing organization or created by a different reseller'
        );
      }
    });

    it('should throw if the organization was created by a different reseller', async () => {
      expect.assertions(1);

      const firstReseller = await resellersHelper.createReseller();
      const secondReseller = await resellersHelper.createReseller();

      const organization = await createSampleOrganization(firstReseller);

      try {
        // invoke with random uuids
        await resellersHelper.getOrganizationOrThrow(
          secondReseller.id,
          organization.id
        );
      } catch (error) {
        expect(error.message).toBe(
          'Non-existing organization or created by a different reseller'
        );
      }
    });

    it('should return an organization if it was created by the current provider and reseller', async () => {
      const reseller = await resellersHelper.createReseller();
      const organization = await createSampleOrganization(reseller);

      // invoke with random uuids
      const fetchedOrganization = await resellersHelper.getOrganizationOrThrow(
        reseller.id,
        organization.id
      );
      expect(fetchedOrganization.id).toBe(organization.id);
    });
  });

  describe('#disableOrganization', () => {
    it('should mark the organization as disabled', async () => {
      const reseller = await resellersHelper.createReseller();
      const organization = await createSampleOrganization(reseller);
      const updatedOrganization = await resellersHelper.disableOrganization(
        reseller.id,
        organization.id
      );
      expect(updatedOrganization.is_enabled).toBe(false);
    });
  });

  describe('#enableOrganization', () => {
    it('should mark the organization as disabled', async () => {
      const reseller = await resellersHelper.createReseller();
      const organization = await createSampleOrganization(reseller);
      await resellersHelper.disableOrganization(reseller.id, organization.id);
      const updatedOrganization = await resellersHelper.enableOrganization(
        reseller.id,
        organization.id
      );
      expect(updatedOrganization.is_enabled).toBe(true);
    });
  });

  describe('#deleteOrganization', () => {
    it('should mark the organization as deleted', async () => {
      const reseller = await resellersHelper.createReseller();
      const organization = await createSampleOrganization(reseller);

      await resellersHelper.deleteOrganization(reseller.id, organization.id);

      const updatedOrganization = await resellersHelper
        .knex('organizations')
        .where({
          id: organization.id,
        })
        .first();
      expect(updatedOrganization.deleted_at).toBeInstanceOf(Date);
    });
  });

  describe('#setUsersLimit', () => {
    it('should users limit for the organization', async () => {
      const reseller = await resellersHelper.createReseller();
      const organization = await createSampleOrganization(reseller);

      const updatedOrganization = await resellersHelper.setUsersLimit({
        reseller_id: reseller.id,
        id: organization.id,
        limit: 5,
      });
      expect(updatedOrganization.users_limit).toBe(5);
    });
  });
});
