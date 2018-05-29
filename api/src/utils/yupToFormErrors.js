// from https://github.com/jaredpalmer/formik/blob/master/src/index.tsx
// MIT licence

/**
 * Transform Yup ValidationError to a more usable object
 */
export default function yupToFormErrors(yupError) {
  const errors = {};
  for (const err of yupError.inner) {
    if (!errors[err.path]) {
      errors[err.path] = err.message;
    }
  }
  return errors;
}
