import knex from 'knex';

import knexSettings from '../src/utils/knexSettings';

const knexInstance = knex(knexSettings);
const name = process.argv[2];

if (!name) {
  console.error('Usage: `addOrganization.js <name>`'); // eslint-disable-line no-console
  process.exit(1);
}

(async function() {
  const result = await knexInstance('organizations').insert(
    { display_name: name },
    ['id']
  );
  console.log(`Created organization ${name} with id ${result[0].id}`); // eslint-disable-line no-console
  process.exit(0);
})().catch(error => {
  console.error(error.stack); // eslint-disable-line no-console
  process.exit(1);
});
