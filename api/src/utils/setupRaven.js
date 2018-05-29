import Raven from 'raven';

const { SENTRY_DSN } = process.env;

/**
 * Setup raven for a Koa application
 * @param {*} app - a Koa application
 */
export function setupRaven(app) {
  if (!SENTRY_DSN) {
    // eslint-disable-next-line no-console
    console.warn('No Sentry configuration found. Skipping setup!');
    return;
  }

  Raven.config(SENTRY_DSN).install();

  app.on('error', (error, context) => {
    reportRequestError(error, context);
  });

  // eslint-disable-next-line no-console
  console.log('Sentry setup complete');
}

/**
 * Try to report an error to sentry. Also adds request data to the report
 * @param {*} error - an error to report
 * @param {*} context - a Koa context
 */
export function reportRequestError(error, context) {
  if (!SENTRY_DSN) {
    return;
  }

  Raven.captureException(
    error,
    { req: context.req },
    (reportingError, eventId) => {
      if (reportingError) {
        // eslint-disable-next-line no-console
        console.error('Error during reporting error', reportingError);
      } else {
        // eslint-disable-next-line no-console
        console.log(`Reported error ${eventId}`);
      }
    }
  );
}
