import path from 'path';

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import convert from 'koa-convert';
import { graphiqlKoa, graphqlKoa } from 'graphql-server-koa';
import jwt from 'koa-jwt';
import knex from 'knex';
import koaBunyanLogger from 'koa-bunyan-logger';
import logger from 'koa-logger';
import mount from 'koa-mount';
import proxies from 'koa-proxies';
import route from 'koa-route';
import send from 'koa-send';
import staticCache from 'koa-static-cache';

import UserError from './utils/UserError';
import apiVersionCheck from './middlewares/apiVersionCheck';
import authHandler from './handlers/authHandler';
import autoLoginHandler from './handlers/autoLoginHandler';
import changePasswordHandler from './handlers/changePasswordHandler';
import checkSetPasswordTokenHandler from './handlers/checkSetPasswordTokenHandler';
import { createAdminHelper, createModels } from './models';
import graphqlSchema from './schema';
import knexSettings from './utils/knexSettings';
import registrationHandler from './handlers/registrationHandler';
import rememberPasswordHandler from './handlers/rememberPasswordHandler';
import renderIndexPage from './utils/renderIndexPage';
import { reportRequestError, setupRaven } from './utils/setupRaven';
import { setupResellersApp } from './resellers';

// 0.0.0.0 is required for docker and safe in this context
const APP_HOST = '0.0.0.0';
// `PORT` environment variable is used on heroku
const APP_PORT = process.env.PORT || '3030';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const {
  FORCE_HTTPS,
  REDIRECT_TO_DOMAIN,
  SECRET_KEY,
  WEBDAV_PROXY_TARGET,
} = process.env;
if (!SECRET_KEY) {
  throw new Error('SECRET_KEY environment variable is required');
}

if (IS_PRODUCTION && !FORCE_HTTPS) {
  /* eslint-disable no-console */
  console.warn(
    'The app is running in production mode but HTTPS redirection is disabled'
  );
  /* eslint-enable no-console */
}

// used in response headers for static assets to inform browser how long
// to cache items
const ONE_DAY_IN_SECONDS = 365 * 24 * 60 * 60;
const ONE_YEAR_IN_SECONDS = 365 * ONE_DAY_IN_SECONDS;
// A path to a folder with assets served in production. It is copied from
// a production version of the docker image for the react UI.
const PUBLIC_PATH = path.join(__dirname, '..', 'public-build');

// staring point of the application
function runServer() {
  // setup database connection
  const knexInstance = knex({
    ...knexSettings,
  });

  const app = new Koa();
  // required to get correct request ip address on heroku
  app.proxy = true;

  // Sentry error reporting
  setupRaven(app);

  if (IS_PRODUCTION) {
    // Setup production logging
    app.use(koaBunyanLogger());
    app.use(koaBunyanLogger.requestIdContext());
    app.use(
      koaBunyanLogger.requestLogger({
        updateLogFields: data => {
          // Sanitize the 'Authorization' header - it shouldn't be shown in logs
          const clonedData = {
            ...data,
            req: {
              ...data.req,
              headers: { ...data.req.headers },
            },
          };
          if (clonedData.req.headers.authorization) {
            clonedData.req.headers.authorization = '<redacted>';
          }
          return clonedData;
        },
      })
    );
  } else {
    // TODO: use bunyan with a different config in development
    app.use(logger());
  }

  if (FORCE_HTTPS) {
    // a simple middleware for redirection from HTTP to HTTPS
    // and setting strict transport security
    app.use(async (ctx, next) => {
      // set strict transport security header for 365 days
      ctx.set('strict-transport-security', 'max-age=31536000');
      if (!ctx.secure) {
        ctx.redirect(`https://${ctx.hostname}${ctx.url}`);
        return;
      }
      await next();
    });
  }

  if (REDIRECT_TO_DOMAIN) {
    // redirect from old domain to the new one set as the `REDIRECT_TO_DOMAIN`
    // environment variable (e. g. redirect from admin.crosscloud.me
    // to admin.crosscloud.io)
    app.use(async (ctx, next) => {
      if (
        // ignore some paths - graphql and /auth/* because of fixed fingerprints
        // in the client
        !(ctx.hostname === REDIRECT_TO_DOMAIN) &&
        !(ctx.url === '/graphql') &&
        !ctx.url.startsWith('/auth/') &&
        !ctx.url.startsWith('/webdav/')
      ) {
        ctx.redirect(`https://${REDIRECT_TO_DOMAIN}${ctx.url}`);
        return;
      }
      await next();
    });
  }

  if (WEBDAV_PROXY_TARGET) {
    const webdavProxyApp = new Koa();
    webdavProxyApp.use(
      proxies('/', {
        target: WEBDAV_PROXY_TARGET,
        changeOrigin: true,
        prependPath: false,
      })
    );
    app.use(mount('/webdav', webdavProxyApp));
  }

  // a simple check if API version is compatible
  app.use(apiVersionCheck);

  // body parser is required by graphql middleware and also used
  // by the authentication handler
  app.use(bodyParser());

  // Make an instance of models available in handlers.
  // There is a separate instance created per requests because
  // Facebook's Dataloader library is used in models and we want to have
  // a clean cache for each request.
  app.use((ctx, next) => {
    ctx.models = createModels({ knex: knexInstance });
    return next();
  });

  // change password handler
  app.use(route.post('/auth/change-password', changePasswordHandler));

  // check set password token handler
  app.use(
    route.post('/auth/check-set-password-token', checkSetPasswordTokenHandler)
  );

  // authentication handler
  app.use(route.get('/auth/admin-auto-login/:token', autoLoginHandler));
  app.use(route.post('/auth/local', authHandler));
  app.use(route.post('/auth/register', registrationHandler));
  app.use(route.post('/auth/remember-password', rememberPasswordHandler));

  // create a separate Koa app for GraphQL endpoint (to apply additional
  // middlewares only for it)
  const graphqlApp = new Koa();
  // Require a valid JWT token to access the graphql endpoint
  graphqlApp.use(
    jwt({
      algorithms: ['HS512'],
      // use jwtData instead of `user` for the decoded data
      key: 'jwtData',
      secret: SECRET_KEY,
    })
  );

  // Read the jwt token and find a user by the `uid` field in it
  graphqlApp.use(async (ctx, next) => {
    const { jwtData } = ctx.state;
    const { models } = ctx;
    // load user based on the data in JWT token
    let user = await models.users.byId.load(jwtData.uid);

    if (!await models.usersHelper.isUserEnabled(user)) {
      // there is no user with the ID from JWT (e.g. was removed or disabled)
      ctx.throw(401, 'Invalid token');
    }

    // this method return an updated user instance
    user = await models.users.updateLastRequestData(user.id, ctx.ip);

    ctx.state.user = user;
    await next();
  });

  // setup graphql schema
  graphqlApp.use(
    graphqlKoa(ctx => {
      const { user } = ctx.state;
      return {
        schema: graphqlSchema,
        context: {
          ...ctx.models,
          adminHelper: createAdminHelper(knexInstance, user, ctx.models),
          user,
        },
        formatError: error => {
          // Hide the actual error message from end users (if the error isn't
          // an instance of the UserError class - these ones are considered
          // whitelisted, e.g. can have meaningful info for the user)
          if (
            !(error.originalError && error.originalError instanceof UserError)
          ) {
            // try to report the error to sentry
            reportRequestError(error.originalError || error, ctx);
            // use bunyan logger if available - otherwise errors are not shown
            // in logs on production
            /* eslint-disable no-console */
            ctx.log ? ctx.log.error(error) : console.error(error.stack);
            /* eslint-enable no-console */
            error.message = 'Error during processing request';
          }
          return error;
        },
      };
    })
  );

  app.use(mount('/graphql', graphqlApp));

  // GraphiQL - UI for graphql
  app.use(
    mount(
      '/graphiql',
      graphiqlKoa({
        endpointURL: '/graphql',
        passHeader: "'Authorization': 'Bearer ' + localStorage['ccauthtoken']",
        query: `{
  currentUser {
    id
    email
    roles
    sync_rules {
      id
      path
      csp_ids
    }
    organization {
      id
      display_name
      encryption {
        enabled
      }
      policies {
        name
        type
        criteria
      }
    }
  }
}`,
      })
    )
  );

  // Optionally setup resellers / odin platform
  setupResellersApp(app, { knex: knexInstance });

  // Serve assets if the app is running in the production mode
  if (IS_PRODUCTION) {
    const assetsApp = new Koa();

    assetsApp.use(async (ctx, next) => {
      await next();
      // remove `last-modified` header because it changes with every docker build
      ctx.remove('last-modified');

      // 1.app.js is for zxcvbn
      if (
        ctx.path === '/app.js' ||
        ctx.path === '/0.app.js' ||
        ctx.path === '/1.app.js'
      ) {
        // app.js doesn't have caching hash
        // TODO: fix it
        ctx.remove('Cache-Control');
      }
    });

    assetsApp.use(
      convert(
        staticCache(path.join(PUBLIC_PATH, 'assets'), {
          gzip: true,
          usePrecompiledGzip: true,
          maxAge: ONE_YEAR_IN_SECONDS,
        })
      )
    );

    app.use(mount('/assets', assetsApp));

    // Support `/` and `/favicon.ico` endpoints in production
    app.use(async (ctx, next) => {
      if (ctx.method === 'GET') {
        // support favicon.ico path
        if (ctx.path === '/favicon.ico') {
          await send(ctx, 'favicon.ico', {
            maxage: ONE_DAY_IN_SECONDS,
            root: PUBLIC_PATH,
          });
          return;
        }
        if (ctx.accepts('html') || ctx.path === '/') {
          // send index.html for requests for '/' or other paths
          // (for HTML5 history API compatibility)
          ctx.body = renderIndexPage();
          return;
        }
      }
      await next();
    });
  }

  app.listen(APP_PORT, APP_HOST, error => {
    if (error) {
      /* eslint-disable no-console */
      console.error(error);
      /* eslint-enable no-console */
      return;
    }
    /* eslint-disable no-console */
    console.log(
      `CrossCloud Console API is now running on http://${APP_HOST}:${APP_PORT}`
    );
    /* eslint-enable no-console */
  });
}

runServer();
