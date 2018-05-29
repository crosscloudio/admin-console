jest.mock('node-fetch');

describe('MailjetEmails', () => {
  beforeEach(() => {
    Date.now = jest.fn(
      // Tue May 30 2017 10:40:16 GMT+0200 (CEST)
      () => 1496133616539
    );
  });

  describe('#sendResetPasswordEmail', () => {
    it('should sent email', async () => {
      jest.resetModules();
      process.env.MAILJET_API_KEY = 'sample key';
      process.env.MAILJET_API_SECRET = 'sample secret';
      process.env.MAILJET_SENDER_EMAIL = 'me@example.com';
      delete process.env.SMTP_SENDER_EMAIL;
      delete process.env.SMTP_URL;

      const fetch = require('node-fetch'); // eslint-disable-line global-require
      const MailjetEmails = require(// eslint-disable-line global-require
      '../MailjetEmails').default;

      const helper = new MailjetEmails();
      const fakeUser = {
        id: 1,
        name: 'John Smith',
        email: 'sample@test.org',
      };

      // `Set password` email
      await helper.sendResetPasswordEmail(fakeUser, { initial: true });
      expect(fetch.getMockArgs()).toMatchSnapshot();

      // `Reset password` email
      await helper.sendResetPasswordEmail(fakeUser);
      expect(fetch.getMockArgs()).toMatchSnapshot();
    });
  });
});
