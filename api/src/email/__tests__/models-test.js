describe('createEmailHelper', () => {
  it('should return an instance of the mailjet helper if the environment variables are set', () => {
    jest.resetModules();
    process.env.MAILJET_API_KEY = 'sample key';
    process.env.MAILJET_API_SECRET = 'sample secret';
    process.env.MAILJET_SENDER_EMAIL = 'me@example.com';
    delete process.env.SMTP_SENDER_EMAIL;
    delete process.env.SMTP_URL;

    const modelsModule = require('../models'); // eslint-disable-line global-require
    const MailjetEmails = require(// eslint-disable-line global-require
    '../implementations/MailjetEmails').default;

    const helper = modelsModule.createEmailHelper();
    expect(helper).toBeInstanceOf(MailjetEmails);
  });

  it('should return an instance of the smtp helper if the environment variables are set', () => {
    jest.resetModules();
    delete process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_API_SECRET;
    delete process.env.MAILJET_SENDER_EMAIL;
    process.env.SMTP_SENDER_EMAIL = 'me@example.com';
    process.env.SMTP_URL = 'smtps://user%40gmail.com:pass@smtp.gmail.com';

    const modelsModule = require('../models'); // eslint-disable-line global-require
    const SmtpEmails = require(// eslint-disable-line global-require
    '../implementations/SmtpEmails').default;

    const helper = modelsModule.createEmailHelper();
    expect(helper).toBeInstanceOf(SmtpEmails);
  });

  it('should return an instance of the debug helper if the environment variables are not set', () => {
    jest.resetModules();
    delete process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_API_SECRET;
    delete process.env.MAILJET_SENDER_EMAIL;
    delete process.env.SMTP_SENDER_EMAIL;
    delete process.env.SMTP_URL;

    const modelsModule = require('../models'); // eslint-disable-line global-require
    const DebugEmails = require(// eslint-disable-line global-require
    '../implementations/DebugEmails').default;

    const helper = modelsModule.createEmailHelper();
    expect(helper).toBeInstanceOf(DebugEmails);
  });
});
