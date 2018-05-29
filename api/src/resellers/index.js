import Koa from 'koa';
import basicAuth from 'basic-auth';
import { graphiqlKoa, graphqlKoa } from 'graphql-server-koa';
import mount from 'koa-mount';

import { createResellersHelper, createResellersModels } from '../models';
import resellersGraphqlSchema from './schema';

const { ENABLE_RESELLERS_APP } = process.env;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function setupResellersApp(app, { knex }) {
  // only enable the resellers app if requested
  if (!ENABLE_RESELLERS_APP) {
    return;
  }

  const resellersGraphqlApp = new Koa();

  // A simple provider authentication middleware
  resellersGraphqlApp.use(async (ctx, next) => {
    const authData = basicAuth(ctx);
    if (!(authData && authData.name && authData.pass)) {
      ctx.throw(401);
      return;
    }

    const models = createResellersModels({ knex });
    // use basic auth for reseller authentication
    // `id` is sent as the _name_ part and `token` as a _password_
    const provider = await models.resellerProviders.getByIdAndToken(
      authData.name,
      authData.pass
    );
    if (!provider) {
      ctx.throw(403);
    }

    ctx.models = models;
    ctx.resellersHelper = createResellersHelper({
      knex,
      models,
      providerId: provider.id,
    });

    await next();
  });

  // setup graphql schema
  resellersGraphqlApp.use(
    graphqlKoa(ctx => {
      return {
        schema: resellersGraphqlSchema,
        context: {
          ...ctx.models,
          resellersHelper: ctx.resellersHelper,
        },
      };
    })
  );
  app.use(mount('/resellers/graphql', resellersGraphqlApp));
  if (!IS_PRODUCTION) {
    app.use(
      mount(
        '/resellers/graphiql',
        graphiqlKoa({
          endpointURL: '/resellers/graphql',
          passHeader:
            "'Authorization': 'Basic ' + btoa(localStorage['ccproviderid'] + ':' + localStorage['ccprovidertoken'])",
        })
      )
    );
  }
}
