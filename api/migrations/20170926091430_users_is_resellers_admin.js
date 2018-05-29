const USER_TABLES = ['users', 'deleted_users'];

exports.up = async function(knex) {
  for (const tableName of USER_TABLES) {
    // eslint-disable-next-line no-await-in-loop
    await knex.schema.table(tableName, table => {
      table.boolean('is_resellers_admin').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function(knex) {
  for (const tableName of USER_TABLES) {
    // eslint-disable-next-line no-await-in-loop
    await knex.schema.table(tableName, table => {
      table.dropColumn('is_resellers_admin');
    });
  }
};
