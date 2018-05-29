import zxcvbn from 'zxcvbn';

import { ZXCVBN_USER_INPUTS } from '../utils/zxcvbnInputs';
import { verifyChangePasswordToken } from '../utils/tokens';

// A change password handler. Checks the token provided in the request body
// and if it's correct updates the user password
export default async function changePasswordHandler(ctx) {
  // The request body should have two fields:
  // - `token` - the JWT token from the 'change password' url
  // - `password` - the new password to set
  if (!(ctx.request.body.token && ctx.request.body.password)) {
    ctx.throw(400, 'token and password required');
  }

  let payload;

  // try to verify and decode the JWT token
  try {
    payload = await verifyChangePasswordToken(
      ctx.request.body.token,
      ctx.models.users
    );
  } catch (error) {
    ctx.body = { error: 'Cannot change password' };
    ctx.status = 400;
    return;
  }

  const user = await ctx.models.users.get(payload.uid);
  if (!user) {
    // the token was issued correctly but the user was probably deleted
    ctx.body = { error: 'Cannot change password' };
    ctx.status = 400;
    return;
  }

  const passwordCheckResult = zxcvbn(
    ctx.request.body.password,
    // don't allow to provide `CrossCloud` or similar strings and also
    // the email address of the user
    [...ZXCVBN_USER_INPUTS, user.email]
  );
  if (passwordCheckResult.score < 3) {
    ctx.body = { error: 'The new password is too easy to guess' };
    ctx.status = 400;
    return;
  }

  await ctx.models.users.changePassword(user.id, ctx.request.body.password);

  ctx.body = {
    ok: true,
  };
}
