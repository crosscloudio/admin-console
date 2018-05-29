jest.mock('nodemailer');

describe('SmtpEmails', () => {
  beforeEach(() => {
    Date.now = jest.fn(
      // Tue May 30 2017 10:40:16 GMT+0200 (CEST)
      () => 1496133616539
    );
  });

  describe('#sendResetPasswordEmail', () => {
    it('should sent email', async () => {
      jest.resetModules();

      process.env.SMTP_URL = 'smtp://localhost:4444/?secure=false';
      process.env.SMTP_SENDER_EMAIL = 'me@gmail.com';
      delete process.env.MAILJET_API_KEY;
      delete process.env.MAILJET_API_SECRET;
      delete process.env.MAILJET_SENDER_EMAIL;

      const SmtpEmails = require(// eslint-disable-line global-require
      '../SmtpEmails').default;

      const helper = new SmtpEmails();
      const fakeUser = {
        id: 1,
        name: 'John Smith',
        email: 'sample@gmail.com',
      };

      const nodemailer = require('nodemailer'); // eslint-disable-line global-require

      // `Set password` email
      await helper.sendResetPasswordEmail(fakeUser, { initial: true });
      expect(nodemailer.getSentMails()).toMatchSnapshot();

      // `Reset password` email
      await helper.sendResetPasswordEmail(fakeUser);
      expect(nodemailer.getSentMails()).toMatchSnapshot();
    });
  });
});
