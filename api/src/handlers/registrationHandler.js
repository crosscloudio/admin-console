import Yup from 'yup';
import zxcvbn from 'zxcvbn';

import { ZXCVBN_USER_INPUTS } from '../utils/zxcvbnInputs';
import { loginUser } from '../utils/auth';
import rateLimit from '../utils/rateLimit';
import yupToFormErrors from '../utils/yupToFormErrors';

function createRegistrationSchema(models) {
  return Yup.object().shape({
    user_name: Yup.string().required('Please provide your name'),
    company_name: Yup.string().test(
      'check-company-name-availability',
      'Company with this name already exists',
      name => {
        if (!name) {
          return true;
        }
        return models.organizations.checkIfNameAvailable(name);
      }
    ),
    email: Yup.string()
      .required('Email is required')
      .email('Invalid email address')
      .test(
        'check-name-availability',
        'User with this email already exists',
        email => models.users.checkIfEmailAvailable(email)
      ),
    password: Yup.string()
      .required('Please provide password')
      .min(
        8,
        'Password should have at least ${min} chars' // eslint-disable-line no-template-curly-in-string
      )
      .test('password-zxcvbn', 'Password is not strong enough', function(
        password
      ) {
        // don't allow to provide `CrossCloud` or similar strings and also
        // the email address of the user
        const userInputs = [...ZXCVBN_USER_INPUTS];
        if (this.parent.email) {
          userInputs.push(this.parent.email);
        }
        const passwordCheckResult = zxcvbn(password, userInputs);
        return passwordCheckResult.score >= 3;
      }),
  });
}

export default async function registrationHandler(ctx) {
  if (typeof ctx.request.body !== 'object') {
    ctx.throw(400, 'Please provide registration data');
  }

  const schema = createRegistrationSchema(ctx.models);
  let data;
  try {
    data = await schema.validate(ctx.request.body, { abortEarly: false });
  } catch (error) {
    ensureValidationErrors(error);
    ctx.body = { errors: yupToFormErrors(error) };
    ctx.status = 422;
    return;
  }

  await rateLimit({
    category: 'register',
    id: ctx.ip,
    max: 10,
    duration: 3600000, // 1 hour
  });
  const newUser = await ctx.models.registrationHelper.register(data);
  const { token } = await loginUser({
    ip: ctx.ip,
    models: ctx.models,
    requireAdmin: true,
    user: newUser,
  });
  ctx.body = { token };
}

// Yup converts all errors to ValidationErrors if invoked with `abortEarly: false`
// hiding application errors. This function checks if it happened and throws
// previously hidden non validation errors
function ensureValidationErrors(baseError) {
  for (const error of baseError.inner) {
    for (const suberror of error.errors) {
      if (typeof suberror !== 'string' && suberror.name !== 'ValidationError') {
        throw suberror;
      }
    }
  }
}
