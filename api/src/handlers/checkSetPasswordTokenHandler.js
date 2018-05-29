import { verifyChangePasswordToken } from '../utils/tokens';

// A handler checking if the JWT token used for the "remember password"
// functionality is correct. Used in the UI to decide if the form for providing
// a new password should be showed or an error otherwise
export default async function checkSetPasswordTokenHandler(ctx) {
  if (!ctx.request.body.token) {
    ctx.throw(400, 'token required');
  }

  let tokenCorrect;
  let verifyPayload;

  // email of the user (if the token is correct) is also sent in the response
  // to warn if the new password is the same as the user email
  let email;

  try {
    verifyPayload = await verifyChangePasswordToken(
      ctx.request.body.token,
      ctx.models.users
    );
    tokenCorrect = true;
  } catch (error) {
    tokenCorrect = false;
  }

  if (verifyPayload) {
    const user = await ctx.models.users.get(verifyPayload.uid);
    if (user) {
      email = user.email;
    } else {
      // the token was issued correctly but the user was probably deleted
      tokenCorrect = false;
    }
  }

  ctx.body = {
    ok: tokenCorrect,
    email,
  };
}
