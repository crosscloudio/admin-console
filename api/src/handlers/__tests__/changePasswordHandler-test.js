import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import request from 'supertest-as-promised';

import changePasswordHandler from '../changePasswordHandler';
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

describe('changePasswordHandler', () => {
  let app;
  let changePasswordMock;

  beforeEach(() => {
    Date.now = jest.fn(
      // Tue May 30 2017 10:40:16 GMT+0200 (CEST)
      () => 1496133616539
    );

    app = new Koa();
    app.use(bodyParser());

    changePasswordMock = jest.fn();

    // make models available in the app context
    app.use((ctx, next) => {
      ctx.models = {
        users: {
          changePassword: changePasswordMock,
          get: id => allUsers.find(user => user.id === id),
        },
      };
      return next();
    });
    app.use(changePasswordHandler);
  });

  it("should return 400 if the provided password is the same as the user's email", async () => {
    const token = await getChangePasswordToken(allUsers[0]);
    const response = await request(app.listen())
      .post('/')
      .send({ token, password: allUsers[0].email })
      .expect(400);
    expect(response.body).toBeTruthy();
    expect(response.body).toEqual({
      error: 'The new password is too easy to guess',
    });
  });

  it('should return 400 if the provided password is too simple', async () => {
    const token = await getChangePasswordToken(allUsers[0]);
    const response = await request(app.listen())
      .post('/')
      .send({ token, password: 'some password' })
      .expect(400);
    expect(response.body).toBeTruthy();
    expect(response.body).toEqual({
      error: 'The new password is too easy to guess',
    });
  });

  it('should change the user password if the token is correct and the password is provided', async () => {
    const token = await getChangePasswordToken(allUsers[0]);
    const response = await request(app.listen())
      .post('/')
      .send({ token, password: 'some very complicated password' })
      .expect(200);
    expect(response.body).toBeTruthy();
    expect(response.body.ok).toBe(true);
    expect(changePasswordMock).toHaveBeenCalledWith(
      allUsers[0].id,
      'some very complicated password'
    );
  });

  it('should return 400 if the token is incorrect', async () => {
    // a correct token without the last chars
    const token =
      'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTQ5NjEzMzYxNiwiZXhwIjoxNDk2MzkyODE2LCJzdWIiOiJwYXNzd29yZC1zZXQifQ.wvewANIKzbgJ_HGXo6zRRlNXXFjCC7GZ7E7KRd1zJR4_CzRKMtUVJWkvJNmMKbTueRN9iCpn2bQFSEYeol-d';
    const response = await request(app.listen())
      .post('/')
      .send({ token, password: 'some password' })
      .expect(400);
    expect(response.body).toBeTruthy();
    expect(response.body).toEqual({ error: 'Cannot change password' });
  });

  it('should return 400 if the token was signed with incorrect algorithm', async () => {
    // a correct token signed with HS256
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTQ5NjEzMzYxNiwiZXhwIjoxNDk2MzkyODE2LCJzdWIiOiJwYXNzd29yZC1zZXQifQ.uJH2h0OjvwuXVHo712qXUJe_prWjIhprVH7M32FV03k';
    const response = await request(app.listen())
      .post('/')
      .send({ token, password: 'some very complicated password' })
      .expect(400);
    expect(response.body).toBeTruthy();
    expect(response.body).toEqual({ error: 'Cannot change password' });
  });

  it('should return 400 if the password was not provided', async () => {
    // a correct token without the last chars
    const token =
      'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTQ5NjEzMzYxNiwiZXhwIjoxNDk2MzkyODE2LCJzdWIiOiJwYXNzd29yZC1zZXQifQ.wvewANIKzbgJ_HGXo6zRRlNXXFjCC7GZ7E7KRd1zJR4_CzRKMtUVJWkvJNmMKbTueRN9iCpn2bQFSEYeol-d';
    const response = await request(app.listen())
      .post('/')
      .send({ token })
      .expect(400);
    expect(response.body).toBeTruthy();
    expect(response.text).toBe('token and password required');
  });
});
