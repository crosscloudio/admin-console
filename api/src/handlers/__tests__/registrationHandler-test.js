import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import knex from 'knex';
import request from 'supertest-as-promised';

import { createModels } from '../../models';
import knexSettings from '../../utils/knexSettings';
import registrationHandler from '../registrationHandler';

describe('registrationHandler', () => {
  let app;
  let knexInstance;
  let transaction;
  let models;

  beforeEach(async () => {
    knexInstance = knex(knexSettings);
    await new Promise((resolve, reject) => {
      knexInstance
        .transaction(trx => {
          // WARNING: don't use async/await in this callback (or return a promise)
          // or the transaction will be automatically commited
          transaction = trx;
          models = createModels({ knex: transaction });
          resolve();
        })
        .catch(reject);
    });
    Date.now = jest.fn(
      // Tue May 30 2017 10:40:16 GMT+0200 (CEST)
      () => 1496133616539
    );

    app = new Koa();
    app.use(bodyParser());

    // make models available in the app context
    app.use((ctx, next) => {
      ctx.models = models;
      return next();
    });
    app.use(registrationHandler);
  });

  afterEach(async () => {
    await transaction.rollback();
    await knexInstance.destroy();
  });

  it('should throw if the data is incorrect', async () => {
    const response = await request(app.listen()).post('/').send({}).expect(422);
    expect(response.body).toMatchSnapshot();
  });

  it('should create a user and an organization if the data is incorrect', async () => {
    const response = await request(app.listen())
      .post('/')
      .send({
        email: 'user@example.com',
        password: 'a some very complicated password',
        user_name: 'John Smith',
      })
      .expect(200);
    expect(response.body).toBeTruthy();
    expect(response.body.token).toBeTruthy();
  });
});
