exports.up = async function(knex) {
  await knex.schema.createTable('resellers_providers', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable().unique();
    table.string('token');
    table.timestamps(false, true);
  });

  // delete already created resellers and related data
  await knex.raw(`
    DELETE FROM users WHERE organization_id IN (
      SELECT id FROM organizations WHERE reseller_id IS NOT NULL
    );
    DELETE FROM organizations WHERE reseller_id IS NOT NULL;
    DELETE FROM resellers;
  `);

  await knex.schema.table('resellers', table => {
    table
      .uuid('provider_id')
      .references('resellers_providers.id')
      .notNullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.table('resellers', table => {
    table.dropColumn('provider_id');
  });
  await knex.schema.dropTable('resellers_providers');
};
