import fs from 'fs';
import path from 'path';

import Handlebars from 'handlebars';
import { memoize } from 'lodash';

import { getChangePasswordUrl } from '../../utils/tokens';

let getEmailTemplate = name => {
  const templateText = fs.readFileSync(
    path.join(__dirname, '..', 'templates', `${name}.hbs`),
    'utf8'
  );
  return Handlebars.compile(templateText);
};

// cache precompiled templates in production
if (process.env.NODE_ENV === 'production') {
  getEmailTemplate = memoize(getEmailTemplate);
}

/**
 * A base email helper class
 */
export default class BaseEmails {
  /**
   * Send an email.
   * An abstract class which requires `sendImpl` method to be defined
   * in child classes. For concrete implementations see `DebugEmails`
   * and `MailjetEmails`.
   * @param{string} templateName - name of the template file used to render
   * There should be files (Handlebars.js templates) `${templateName}.txt.hbs`
   * and `${templateName}.html.hbs` in the './templates/' folder.
   * @param{Object} props - an object with data used to render and send
   * the email. Possible properties:
   * - `data` - an object with data used to render the email templates
   * - `subject` - the subject of the email
   * - `to` - an object in format {email: "me@example.com", name: "My name"}
   *   with the address data
   * - `trackClicks` - a boolean which allows to setup click tracking
   * @returns{Promise}
   */
  async send(templateName, { data, ...other }) {
    const txtTemplate = getEmailTemplate(`${templateName}.txt`);
    const body = txtTemplate(data);
    const htmlTemplate = getEmailTemplate(`${templateName}.html`);
    const htmlBody = htmlTemplate(data);
    await this.sendImpl({ body, htmlBody, ...other });
  }

  /**
   * Send a reset password email to the user
   * @param{Object} user
   * @param{Object} additionalData - additional data used for rendering
   * the template (currently only `firstTime` field)
   * @returns{Promise}
   */
  async sendResetPasswordEmail(user, additionalData = {}) {
    const resetPasswordUrl = await getChangePasswordUrl(user);
    const actionName = additionalData.initial ? 'Set' : 'Reset';
    await this.send('reset-password', {
      to: {
        email: user.email,
        name: user.name,
      },
      subject: `${actionName} CrossCloud password`,
      data: {
        name: user.name,
        resetPasswordUrl,
        ...additionalData,
      },
      trackClicks: false,
    });
  }
}
