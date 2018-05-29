import Yup from 'yup';
import mimeDb from 'mime-db';

import UserError from './UserError';

const AVAILABLE_MIME_TYPES = new Set(Object.keys(mimeDb));

// `.` and also `" * / : < > ? \ |` which are invalid characters in NTFS
// filesystem (according to
// https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words )
// NOTE: should be in sync with react/src/components/control/Control.jsx
//
/* eslint-disable no-useless-escape */
const INVALID_EXTENSION_CHARS_RE = /[\.\"\*\/\:\<\>\?\\\|]/;
/* eslint-enable no-useless-escape */

// https://stackoverflow.com/a/20971688/2750114
/* eslint-disable max-len, no-useless-escape */
const PHONE_REGEX = /^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i;
/* eslint-enable max-len, no-useless-escape */

const emailValidator = () => Yup.string().email('Invalid email address');
const phoneValidator = () =>
  Yup.string()
    // https://stackoverflow.com/questions/14894899/what-is-the-minimum-length-of-a-valid-international-phone-number
    .min(4, 'Phone number should be at least 4 characters logs')
    .max(24, 'Phone number should be at most 24 characters logs')
    .matches(PHONE_REGEX, 'Invalid phone number');

/**
 * Validate contact data
 * @param {Object} data - data to validate
 * @returns {Promise<Object>} - validated data
 */
export function validateContactData(data, { models, ignoredId }) {
  // should be in sync with ContactInfoForm in the React UI code
  const schema = Yup.object().shape({
    display_name: Yup.string()
      .required('Company name is required')
      .test(
        'check-company-name-availability',
        'Company with this name already exists',
        name => {
          return models.organizations.checkIfNameAvailable(name, { ignoredId });
        }
      ),
    admin_phone: phoneValidator(),
    admin_email: emailValidator(),
    billing_phone: phoneValidator(),
    billing_email: emailValidator(),
  });
  const dataWithoutEmptyStrings = Object.keys(data).reduce((result, key) => {
    if (data[key]) {
      result[key] = data[key];
    }
    return result;
  }, {});
  return schema.validate(dataWithoutEmptyStrings);
}

export function validatePolicy(policyData) {
  switch (policyData.type) {
    case 'fileextension': {
      const match = policyData.criteria.match(INVALID_EXTENSION_CHARS_RE);
      if (match) {
        throw new UserError(
          `Extension contains invalid character: ${match[0]}`
        );
      }
      return;
    }

    case 'mimetype': {
      const mimeTypes = policyData.criteria.split(',');
      mimeTypes.forEach(mimeType => {
        if (!AVAILABLE_MIME_TYPES.has(mimeType)) {
          throw new UserError(`Incorrect mime type: ${mimeType}`);
        }
      });
      return;
    }

    default:
      throw new UserError(`Unsupported policy type: ${policyData.type}`);
  }
}
