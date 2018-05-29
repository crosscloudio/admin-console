import jsonwebtoken from 'jsonwebtoken';
import thenify from 'thenify';

const JWT_OPTIONS = {
  issuer: 'CrossCloud',
  algorithm: 'HS512',
  expiresIn: '365d', // 365 days
};
const { SECRET_KEY } = process.env;

const signToken = thenify(jsonwebtoken.sign);

export async function loginUser({ ip, models, requireAdmin, user }) {
  // Return short lived token (1d) for the admin console or a long lived one
  // for the client app.
  const tokenOptions = requireAdmin ? { expiresIn: '1d' } : {};
  const token = await signAuthToken(user.id, tokenOptions);
  // don't wait for the response
  models.users.updateLastRequestData(user.id, ip, { updateLastLogin: true });
  return { token };
}

function signAuthToken(uid, extraOptions = {}) {
  return signToken({ uid }, SECRET_KEY, { ...JWT_OPTIONS, ...extraOptions });
}
