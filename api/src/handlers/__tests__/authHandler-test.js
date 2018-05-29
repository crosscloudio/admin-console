import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import knex from 'knex';
import request from 'supertest-as-promised';

import authHandler from '../authHandler';
import { createModels } from '../../models';
import knexSettings from '../../utils/knexSettings';

describe('authHandler', () => {
  let app;
  let knexInstance;
  let transaction;
  let models;
  let entities;

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

    entities = await createEntities(models);

    app = new Koa();
    app.use(bodyParser());

    // make models available in the app context
    app.use((ctx, next) => {
      ctx.models = models;
      return next();
    });
    app.use(authHandler);
  });

  afterEach(async () => {
    await transaction.rollback();
    await knexInstance.destroy();
  });

  it('should return a token if the provided credentials are valid', async () => {
    const response = await request(app.listen())
      .post('/')
      .send({ email: 'john@shmith.com', password: 'sample password' })
      .expect(200);
    expect(response.body).toBeTruthy();
    expect(response.body.token).toBeTruthy();
  });

  it('should return a 401 response if the provided credentials are not valid', async () => {
    await request(app.listen())
      .post('/')
      .send({ email: 'john@shmith.com', password: 'incorrect password' })
      .expect(401);
  });

  it('should return a 401 response if the provided credentials are valid, but the user is disabled', async () => {
    await request(app.listen())
      .post('/')
      .send({ email: 'paul@example.com', password: 'sample password' })
      .expect(401);
  });

  it("should return a 401 response if the provided credentials are valid, but the user's organization is disabled", async () => {
    await models.organizations.update(entities.organization.id, {
      is_enabled: false,
    });
    await request(app.listen())
      .post('/')
      .send({ email: 'john@shmith.com', password: 'sample password' })
      .expect(401);
  });

  it("should return a 401 response if the provided credentials are valid, but the user's organization is marked as deleted", async () => {
    await models.organizations.update(entities.organization.id, {
      deleted_at: new Date(),
    });
    await request(app.listen())
      .post('/')
      .send({ email: 'john@shmith.com', password: 'sample password' })
      .expect(401);
  });

  it('should return a 401 response if the admin rights are required but user is not an admin', async () => {
    const response = await request(app.listen())
      .post('/')
      .send({
        email: 'john@shmith.com',
        password: 'sample password',
        requireAdmin: true,
      })
      .expect(401);

    expect(response.body.name).toBe('NotAuthenticated');
    expect(response.body.message).toBe('Admin rights required.');
  });

  it('should return a token if the admin rights are required and user is an admin', async () => {
    const response = await request(app.listen())
      .post('/')
      .send({
        email: 'admin@company.com',
        password: 'admin password',
        requireAdmin: true,
      })
      .expect(200);

    expect(response.body.token).toBeTruthy();
  });
});

async function createEntities(models) {
  const organization = await models.organizations.create({
    display_name: 'FooBar inc.',
  });

  const baseUser = {
    organization_id: organization.id,
    is_enabled: true,
  };

  const userWithoutAdminRights = await models.users.create({
    ...baseUser,
    email: 'john@shmith.com',
    name: 'John',
    roles: ['user'],
    // 'sample password' with 4 rounds
    password_hash:
      '$2a$04$eApl0BQBqI5kkdr9vghnwuygqk9cdHCM1gbC9V96inXDr7HYbwVQ6',
  });

  const userWithAdminRights = await models.users.create({
    ...baseUser,
    email: 'admin@company.com',
    name: 'Admin',
    roles: ['user', 'administrator'],
    // 'admin password' with 4 rounds
    password_hash:
      '$2a$04$j/um7QAyit9CLhi1/qPdn.9vcaytBtPAZQcshkOPMfFNpC2qFRd.u',
  });

  const disabledUser = await models.users.create({
    ...baseUser,
    is_enabled: false,
    email: 'paul@example.com',
    name: 'Paul',
    roles: ['user'],
    // 'sample password' with 4 rounds
    password_hash:
      '$2a$04$eApl0BQBqI5kkdr9vghnwuygqk9cdHCM1gbC9V96inXDr7HYbwVQ6',
  });

  return {
    organization,
    userWithoutAdminRights,
    userWithAdminRights,
    disabledUser,
  };
}
