import fetch from 'node-fetch';

import BaseEmails from './BaseEmails';
import basicAuthHeader from '../../utils/basicAuthHeader';

const {
  MAILJET_API_KEY,
  MAILJET_API_SECRET,
  MAILJET_SENDER_EMAIL,
} = process.env;

/**
 * A helper version which uses mailjet.com for sending emails.
 */
export default class MailjetEmails extends BaseEmails {
  async sendImpl({ body, htmlBody, subject, to, trackClicks }) {
    // setup track click option
    // 0 - use accunts defaults
    // 1 - don't track (if `trackClicks` is literally `false`)
    // 2 - track (if `trackClicks` is literally `true`)
    let trackClicksHeaderValue = 0;
    if (trackClicks === true) {
      trackClicksHeaderValue = 2;
    } else if (trackClicks === false) {
      trackClicksHeaderValue = 1;
    }

    // See https://dev.mailjet.com/guides/#sending-a-basic-email
    // for the API documentation
    const response = await fetch('https://api.mailjet.com/v3/send', {
      method: 'POST',
      headers: {
        Authorization: basicAuthHeader(MAILJET_API_KEY, MAILJET_API_SECRET),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        FromEmail: MAILJET_SENDER_EMAIL,
        FromName: 'CrossCloud',
        Recipients: [{ Email: to.email, Name: to.name }],
        Subject: subject,
        'Text-part': body,
        'Html-part': htmlBody,
        'Mj-trackclick': trackClicksHeaderValue,
      }),
    });
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Request to Mailjet failed:
Status: ${response.status}
Response:
${responseText}`);
    }
  }
}
