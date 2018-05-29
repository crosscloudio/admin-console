import knex from 'knex';

import knexSettings from '../src/utils/knexSettings';

const knexInstance = knex(knexSettings);

const organizationId = process.argv[2];
let newLimit = process.argv[3];

if (!(organizationId && newLimit)) {
  console.error('Usage: `setUsersLimit.js <organizationId> <newLimit>`'); // eslint-disable-line no-console
  process.exit(1);
}

if (parseInt(newLimit, 10) === 0) {
  newLimit = 300000000;
}

(async function() {
  const organization = await knexInstance('organizations')
    .where({
      id: organizationId,
    })
    .first();
  if (!organization) {
    console.error("Organization doesn't exists"); // eslint-disable-line no-console
    process.exit(1);
  }
  await knexInstance('organizations')
    .where({
      id: organizationId,
    })
    .update({ users_limit: newLimit });
  process.exit(0);
})().catch(error => {
  console.error(error.stack); // eslint-disable-line no-console
  process.exit(1);
});
