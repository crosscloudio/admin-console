import knex from 'knex';

import knexSettings from '../src/utils/knexSettings';

const knexInstance = knex(knexSettings);

(async function() {
  const organizations = await knexInstance('organizations').select('*');
  for (const organization of organizations) {
    console.log(
      // eslint-disable-line no-console
      `${organization.display_name}\t${organization.id}\t${organization.users_count}/${organization.users_limit}`
    );
  }
  process.exit(0);
})().catch(error => {
  console.error(error.stack); // eslint-disable-line no-console
  process.exit(1);
});
