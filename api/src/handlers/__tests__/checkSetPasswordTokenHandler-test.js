import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import request from 'supertest-as-promised';

import checkSetPasswordTokenHandler from '../checkSetPasswordTokenHandler';
import { getChangePasswordToken } from '../../utils/tokens';

const baseUser = {
  organization_id: '1',
  is_enabled: true,
};

const allUsers = [
  {
    ...baseUser,
    id: 1,
    email: 'john@shmith.com',
    roles: ['user'],
  },
  {
    id: 2,
    email: 'admin@company.com',
    roles: ['user', 'administrator'],
  },
];

describe('checkSetPasswordTokenHandler', () => {
  let app;

  beforeEach(() => {
    Date.now = jest.fn(
      // Tue May 30 2017 10:40:16 GMT+0200 (CEST)
      () => 1496133616539
    );

    app = new Koa();
    app.use(bodyParser());

    // make models available in the app context
    app.use((ctx, next) => {
      ctx.models = {
        users: {
          get: id => allUsers.find(user => user.id === id),
        },
      };
      return next();
    });
    app.use(checkSetPasswordTokenHandler);
  });

  it('should return truthy status and email if the token is correct', async () => {
    const token = await getChangePasswordToken(allUsers[0]);
    const response = await request(app.listen())
      .post('/')
      .send({ token })
      .expect(200);
    expect(response.body).toEqual({
      ok: true,
      email: 'john@shmith.com',
    });
  });

  it('should return false if the token is incorrect', async () => {
    // a correct token without the last chars
    const token =
      'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTQ5NjEzMzYxNiwiZXhwIjoxNDk2MzkyODE2LCJzdWIiOiJwYXNzd29yZC1zZXQifQ.wvewANIKzbgJ_HGXo6zRRlNXXFjCC7GZ7E7KRd1zJR4_CzRKMtUVJWkvJNmMKbTueRN9iCpn2bQFSEYeol-d';
    const response = await request(app.listen())
      .post('/')
      .send({ token })
      .expect(200);
    expect(response.body).toBeTruthy();
    expect(response.body.ok).toBe(false);
  });

  it('should return false if the token was signed with incorrect algorithm', async () => {
    // a correct token signed with HS256
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTQ5NjEzMzYxNiwiZXhwIjoxNDk2MzkyODE2LCJzdWIiOiJwYXNzd29yZC1zZXQifQ.uJH2h0OjvwuXVHo712qXUJe_prWjIhprVH7M32FV03k';
    const response = await request(app.listen())
      .post('/')
      .send({ token })
      .expect(200);
    expect(response.body).toBeTruthy();
    expect(response.body.ok).toBe(false);
  });
});
