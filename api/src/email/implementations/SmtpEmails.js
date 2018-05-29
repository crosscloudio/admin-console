import nodemailer from 'nodemailer';

import BaseEmails from './BaseEmails';

const { SMTP_SENDER_EMAIL, SMTP_URL } = process.env;

export default class SmtpEmails extends BaseEmails {
  constructor(...args) {
    super(...args);
    this.transporter = nodemailer.createTransport(SMTP_URL);
  }

  async sendImpl({ body, htmlBody, subject, to }) {
    return this.transporter.sendMail({
      from: SMTP_SENDER_EMAIL,
      to: to.email,
      subject,
      text: body,
      html: htmlBody,
    });
  }
}
