// eslint doesn't recognize them as jest globals

import { spawn } from 'child_process';

import fetch from 'node-fetch';
import knex from 'knex';

import knexSettings from '../utils/knexSettings';
import packageJson from '../../package.json';

// mocked in email tests
jest.unmock('node-fetch');

const API_URL = 'http://0.0.0.0:3030';

const DEFAULT_GRAPHQL_QUERY = `{
  currentUser {
    email
    roles
    sync_rules {
      path
      csp_ids
    }
    organization {
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
}`;

const ADMIN_QUERY = `{
  users {
    email
    name
  }
}`;

describe('server', () => {
  let server;
  let knexInstance;

  beforeAll(() => {
    let isResolved = false;
    return new Promise((resolve, reject) => {
      const serverInstance = spawn('node', [
        '-r',
        'source-map-support/register',
        '-r',
        'babel-polyfill',
        'build/',
      ]);
      function checkStdout(data) {
        if (data.toString().includes('CrossCloud Console API is now running')) {
          serverInstance.stdout.removeListener('data', checkStdout);
          server = serverInstance;
          resolve();
          isResolved = true;
        }
      }
      serverInstance.stdout.on('data', checkStdout);
      serverInstance.stderr.on('data', data => {
        console.error(data.toString()); // eslint-disable-line no-console
      });
      serverInstance.on('error', error => {
        if (!isResolved) {
          reject(new Error(`Server exited with error: ${error}`));
          isResolved = true;
        }
      });

      serverInstance.on('exit', code => {
        if (!isResolved) {
          reject(new Error(`Server exited with error code: ${code}`));
          isResolved = true;
        }
      });
    });
  });

  afterAll(() => {
    return new Promise(resolve => {
      if (server) {
        server.kill();
        setTimeout(resolve, 100);
      } else {
        resolve();
      }
    });
  });

  beforeEach(async () => {
    knexInstance = knex(knexSettings);
    await knexInstance.raw(`
      DELETE FROM users;
      DELETE FROM organizations;
    `);

    const [organization] = await knexInstance('organizations')
      .insert({
        display_name: 'Foo Bar Inc.',
      })
      .returning('*');

    const sampleUsers = [
      {
        organization_id: organization.id,
        email: 'john@shmith.com',
        name: 'John Smith',
        // 'sample password' with 4 rounds
        password_hash:
          '$2a$04$eApl0BQBqI5kkdr9vghnwuygqk9cdHCM1gbC9V96inXDr7HYbwVQ6',
        roles: ['user'],
        is_enabled: true,
      },
      {
        organization_id: organization.id,
        email: 'admin@company.com',
        name: 'Patric Doe',
        // 'admin password' with 4 rounds
        password_hash:
          '$2a$04$j/um7QAyit9CLhi1/qPdn.9vcaytBtPAZQcshkOPMfFNpC2qFRd.u',
        roles: ['user', 'administrator'],
        is_enabled: true,
      },
    ];

    for (const user of sampleUsers) {
      await knexInstance('users').insert(user); // eslint-disable-line no-await-in-loop
    }
  });

  describe('graphql endpoint', () => {
    it('should require login', async () => {
      const response = await fetchGraphql(DEFAULT_GRAPHQL_QUERY);
      expect(response.status).toBe(401);
    });

    it('should return a correct response for logged-in users', async () => {
      const token = await getAuthToken('john@shmith.com', 'sample password');
      const response = await fetchGraphql(DEFAULT_GRAPHQL_QUERY, {}, token);
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toMatchSnapshot();
    });

    it('should return 401 for disabled users', async () => {
      const token = await getAuthToken('john@shmith.com', 'sample password');
      await knexInstance('users')
        .where({
          email: 'john@shmith.com',
        })
        .update({
          is_enabled: false,
        });
      const response = await fetchGraphql(DEFAULT_GRAPHQL_QUERY, {}, token);
      expect(response.status).toBe(401);
    });

    it('should not allow to query admin fields for non-admin', async () => {
      const token = await getAuthToken('john@shmith.com', 'sample password');
      const response = await fetchGraphql(ADMIN_QUERY, {}, token);
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toMatchSnapshot();
    });

    // it('should not allow to query admin fields for admins with long-lived tokens', async () => {
    //   const token = await getAuthToken('admin@company.com', 'admin password');
    //   const response = await fetchGraphql(ADMIN_QUERY, {}, token);
    //   expect(response.status).toBe(200);
    //   const responseJson = await response.json();
    //   expect(responseJson).toMatchSnapshot();
    // });

    it('should allow to query admin fields for admins with short-lived tokens', async () => {
      const token = await getAuthToken(
        'admin@company.com',
        'admin password',
        true
      );
      const response = await fetchGraphql(ADMIN_QUERY, {}, token);
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toMatchSnapshot();
    });
  });

  it('should throw if specified unsupported API version', async () => {
    const token = await getAuthToken('john@shmith.com', 'sample password');
    const response = await fetchGraphql(DEFAULT_GRAPHQL_QUERY, {}, token, {
      'X-API-Version-Expected': '100.0.0',
    });
    expect(response.status).toBe(418);
    const responseText = await response.text();
    expect(responseText).toBe('Unsupported API Version');
  });

  it('should throw if specified incorrect API version', async () => {
    const token = await getAuthToken('john@shmith.com', 'sample password');
    const response = await fetchGraphql(ADMIN_QUERY, {}, token, {
      'X-API-Version-Expected': '2016-12-31',
    });
    expect(response.status).toBe(418);
  });

  it('should return a correct response if specified the current API version', async () => {
    const token = await getAuthToken('john@shmith.com', 'sample password');
    const response = await fetchGraphql(DEFAULT_GRAPHQL_QUERY, {}, token, {
      'X-API-Version-Expected': packageJson.version,
    });
    expect(response.status).toBe(200);
    const responseJson = await response.json();
    expect(responseJson).toMatchSnapshot();
  });
});

function fetchGraphql(query, variables = {}, token, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });
}

async function getAuthToken(email, password, requireAdmin) {
  const loginResponse = await fetch(`${API_URL}/auth/local`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      requireAdmin,
    }),
  });
  expect(loginResponse.status).toBe(200);
  const { token } = await loginResponse.json();
  return token;
}
