// A handler which sends a "reset password" email
export default async function rememberPasswordHandler(ctx) {
  if (!ctx.request.body.email) {
    ctx.throw(400, 'email required');
  }

  const user = await ctx.models.users.getByEmail(ctx.request.body.email);
  // don't allow to change password for disabled user
  if (user && user.is_enabled) {
    await ctx.models.emails.sendResetPasswordEmail(user);
  }

  ctx.body = {
    ok: true,
  };
}
