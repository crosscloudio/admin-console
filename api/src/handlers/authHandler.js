import { loginUser } from '../utils/auth';

// An authentication handler
// Checks if the provided user credentials are correct and returns a JWT token
export default async function authHandler(ctx) {
  const { email, password, requireAdmin } = ctx.request.body;
  if (!(email && password)) {
    ctx.body = {
      name: 'InvalidData',
      code: 400,
      message: 'E-mail and password required',
    };
    ctx.status = 400;
    return;
  }

  const { models } = ctx;
  const user = await models.usersHelper.getByEmailAndPassword(email, password);
  if (user) {
    // `requireAdmin` is used by the admin console and means
    // that an extra check should be performed to ensure that the user
    // has admin rights. Otherwise return error.
    if (requireAdmin && !models.users.isAdministrator(user)) {
      prepareInvalidLoginResponse(ctx, 'Admin rights required.');
      return;
    }

    const { token } = await loginUser({
      ip: ctx.ip,
      models,
      requireAdmin,
      user,
    });
    ctx.body = { token };
    return;
  }

  prepareInvalidLoginResponse(ctx, 'Invalid login.');
}

function prepareInvalidLoginResponse(ctx, message) {
  ctx.body = {
    name: 'NotAuthenticated',
    message,
    code: 401,
  };
  ctx.status = 401;
}
