import knex from 'knex';
import readCallback from 'read';
import thenify from 'thenify';

import { hashPassword } from '../src/utils/passwords';
import knexSettings from '../src/utils/knexSettings';

const read = thenify(readCallback);

const knexInstance = knex(knexSettings);
const organizationId = process.argv[2];
const email = process.argv[3];

if (!(organizationId && email)) {
  console.error('Usage: `addUser.js <organizationId> <email>`'); // eslint-disable-line no-console
  process.exit(1);
}

(async function() {
  const [password] = await read({ prompt: 'Password:', silent: true });
  if (!password) {
    console.error('Password required'); // eslint-disable-line no-console
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await knexInstance('users').insert({
    email,
    name: 'Unnamed',
    organization_id: organizationId,
    password_hash: passwordHash,
    roles: ['user', 'administrator'],
  });
  console.log('User created successfully'); // eslint-disable-line no-console
  process.exit(0);
})().catch(error => {
  console.error(error.stack); // eslint-disable-line no-console
  process.exit(1);
});
