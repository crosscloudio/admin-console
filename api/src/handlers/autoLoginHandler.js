import { loginUser } from '../utils/auth';
import { verifyAdminAutoLoginToken } from '../utils/tokens';

const INCORRECT_TOKEN_HTML = `<!DOCTYPE html>
<html lang="en">
<head></head>
<body>
<p>Token is expired or was already used</p>
<p><a href="/forgot-password">Set your password</a></p>
<p><a href="/login">Log in</a></p>
</body>
</html>`;

export default async function autoLoginHandler(ctx, token) {
  const { models } = ctx;
  let payload;

  try {
    payload = await verifyAdminAutoLoginToken(token, models.users);
  } catch (error) {
    ctx.body = INCORRECT_TOKEN_HTML;
    ctx.status = 400;
    return;
  }

  const user = await models.users.get(payload.uid);
  if (!models.usersHelper.isUserEnabled(user)) {
    ctx.body = INCORRECT_TOKEN_HTML;
    ctx.status = 400;
    return;
  }

  const loginData = await loginUser({
    ip: ctx.ip,
    models,
    requireAdmin: true,
    user,
  });

  ctx.body = renderAutoLoginPage(loginData.token);
}

function renderAutoLoginPage(token) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>
localStorage.setItem('ccauthtoken', "${token}");
location.replace('/');
</script>
</head>
<body></body>
</html>`;
}
