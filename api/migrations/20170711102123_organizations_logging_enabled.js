exports.up = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.boolean('logging_enabled').notNullable().defaultTo(true);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropColumn('logging_enabled');
  });
};
