const USER_TABLES = ['users', 'deleted_users'];

exports.up = async function(knex) {
  for (const tableName of USER_TABLES) {
    // eslint-disable-next-line no-await-in-loop
    await knex.schema.table(tableName, table => {
      table.boolean('ac_onboarding_finished').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function(knex) {
  for (const tableName of USER_TABLES) {
    // eslint-disable-next-line no-await-in-loop
    await knex.schema.table(tableName, table => {
      table.dropColumn('ac_onboarding_finished');
    });
  }
};
