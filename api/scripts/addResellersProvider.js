import crypto from 'crypto';

import knex from 'knex';
import thenify from 'thenify';

import knexSettings from '../src/utils/knexSettings';

const knexInstance = knex(knexSettings);
const name = process.argv[2];

if (!name) {
  // eslint-disable-next-line no-console
  console.error('Usage: `addResellersProvider.js <name>`');
  process.exit(1);
}

const randomBytes = thenify(crypto.randomBytes);

(async function() {
  const randomBuffer = await randomBytes(64);
  const token = randomBuffer.toString('base64');
  const result = await knexInstance('resellers_providers').insert(
    { name, token },
    '*'
  );
  const newProvider = result[0];
  // eslint-disable-next-line no-console
  console.log(
    `Created a provider ${name} with id ${newProvider.id} and token:`
  );
  // eslint-disable-next-line no-console
  console.log(newProvider.token);
  process.exit(0);
})().catch(error => {
  console.error(error.stack); // eslint-disable-line no-console
  process.exit(1);
});
