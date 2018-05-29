// this module implements tokens for changing passwords
// based on the implementation used by the Django framework:
// https://github.com/django/django/blob/master/django/contrib/auth/tokens.py
// The one difference - the JWT tokens are used instead the raw ones

import jsonwebtoken from 'jsonwebtoken';
import thenify from 'thenify';

const { APP_ROOT, SECRET_KEY } = process.env;

const HASH_ALGORITHM = 'HS512';

const ADMIN_AUTO_LOGIN_SUBJECT = 'admin-auto-login';
const PASSWORD_SET_SUBJECT = 'password-set';

const signToken = thenify(jsonwebtoken.sign);
const verifyToken = thenify(jsonwebtoken.verify);

/**
 * Create a new JWT token for changing password
 * @param{Object} user
 * @returns{Promise<string>}
 */
export function getChangePasswordToken(user) {
  return getUserToken(user, PASSWORD_SET_SUBJECT);
}

/**
 * Create a new JWT token for auto-logging in
 * @param{Object} user
 * @returns{Promise<string>}
 */
export function getAdminAutoLoginToken(user) {
  // the token should be valid no longer than 15 minutes
  return getUserToken(user, ADMIN_AUTO_LOGIN_SUBJECT, { expiresIn: '15m' });
}

/**
 * Verify a JWT token for changing password
 * @param{string} token - the JWT token
 * @param{Object} users - the Users DAO instance (from models.js)
 * @returns{Promise<boolean>}
 */
export function verifyChangePasswordToken(token, users) {
  return verifyUserToken(token, users, PASSWORD_SET_SUBJECT);
}

/**
 * Verify a JWT token for auto-logging in
 * @param{string} token - the JWT token
 * @param{Object} users - the Users DAO instance (from models.js)
 * @returns{Promise<boolean>}
 */
export function verifyAdminAutoLoginToken(token, users) {
  return verifyUserToken(token, users, ADMIN_AUTO_LOGIN_SUBJECT);
}

/**
 * Generate an URL for changing password
 * @param{Object} user
 * @returns{Promise<string>}
 */
export async function getChangePasswordUrl(user) {
  const token = await getChangePasswordToken(user);
  return `${APP_ROOT}/reset-password/${token}`;
}

/**
 * Generate an URL for changing password
 * @param{Object} user
 * @returns{Promise<string>}
 */
export async function getAdminAutoLoginUrl(user) {
  const token = await getAdminAutoLoginToken(user);
  return `${APP_ROOT}/auth/admin-auto-login/${token}`;
}

/**
 * Get a full secret key for the user. The base secret key is concatenated with
 * the last login date and the password hash. Logging in or changing the
 * password automatically invalidate the token.
 * @param{Object} user
 * @returns{string}
 */
function getUserDataSecretKey(user) {
  const lastLoginString = user.last_login ? `${user.last_login.getTime()}` : '';
  const passwordHashString = user.password_hash || '';
  return SECRET_KEY + lastLoginString + passwordHashString;
}

/**
 * Create a new JWT token which is invalidated automatically if the user
 * logs in or changes his/her password.
 * @param{Object} user
 * @returns{Promise<string>}
 */
function getUserToken(user, subject, extraOpts = {}) {
  const fullSecretKey = getUserDataSecretKey(user);
  return signToken({ uid: user.id }, fullSecretKey, {
    algorithm: HASH_ALGORITHM,
    expiresIn: '3d', // 3 days (tha same as in Django by default),
    subject,
    ...extraOpts,
  });
}

/**
 * Verify a JWT token which is invalidated automatically if the user
 * logs in or changes his/her password.
 * @param{string} token - the JWT token
 * @param{Object} users - the Users DAO instance (from models.js)
 * @returns{Promise<boolean>}
 */
async function verifyUserToken(token, users, subject) {
  // decode the token without verifying it
  const decodedUnverified = jsonwebtoken.decode(token);
  // there should be a user id in the token
  if (!decodedUnverified.uid) {
    throw new Error('Incorrect token');
  }
  // load a user by its id from the token
  const user = await users.get(decodedUnverified.uid);
  if (!user) {
    throw new Error("User doesn't exist");
  }
  if (!user.is_enabled) {
    throw new Error('User is disabled');
  }
  // generate a full secret key based on field in the user instance
  const fullSecretKey = getUserDataSecretKey(user);
  // verify the token using the full secret key
  return verifyToken(token, fullSecretKey, {
    algorithms: [HASH_ALGORITHM],
    subject,
  });
}
