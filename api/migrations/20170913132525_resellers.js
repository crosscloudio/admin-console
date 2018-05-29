exports.up = async function(knex) {
  await knex.schema.createTable('resellers', table => {
    table.uuid('id').primary();

    table.timestamps(false, true);
  });

  await knex.schema.table('organizations', table => {
    table.uuid('reseller_id').references('resellers.id');
    table.boolean('is_enabled').notNullable().defaultTo(true);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropColumn('reseller_id');
    table.dropColumn('is_enabled');
  });
  await knex.schema.dropTable('resellers');
};
