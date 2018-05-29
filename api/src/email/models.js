const {
  MAILJET_API_KEY,
  MAILJET_API_SECRET,
  MAILJET_SENDER_EMAIL,
  SMTP_SENDER_EMAIL,
  SMTP_URL,
} = process.env;

/**
 * Create a new email helper. It creates a mailjet version if its settings are
 * provided as environment variables or a debug one otherwise
 * @returns{BaseEmails}
 */
export function createEmailHelper() {
  let implementation;

  if (MAILJET_API_KEY && MAILJET_API_SECRET && MAILJET_SENDER_EMAIL) {
    implementation = require('./implementations/MailjetEmails'); // eslint-disable-line global-require
  } else if (SMTP_SENDER_EMAIL && SMTP_URL) {
    implementation = require('./implementations/SmtpEmails'); // eslint-disable-line global-require
  } else {
    implementation = require('./implementations/DebugEmails'); // eslint-disable-line global-require
  }

  // use `.default` because of es6 exports used in implementations
  return new implementation.default();
}
