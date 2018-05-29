exports.up = async function(knex) {
  await knex.schema.createTable('shares', table => {
    table.bigIncrements();
    table
      .bigInteger('organization_id')
      .notNullable()
      .unsigned()
      .references('organizations.id');
    table.text('name').notNullable();
    table.string('storage_type').notNullable();
    table.text('unique_id').notNullable();
    table.unique(['organization_id', 'storage_type', 'unique_id']);

    // don't make a m2m relation column and force reference for that
    // to support cases when the CSP is added to the database
    // after creating the share
    table.specificType('storage_unique_ids', 'text[]').notNullable();
    table.timestamps(false, true);
  });
  await knex.raw(
    'CREATE INDEX shares_storage_unique_ids_index on "shares" USING GIN ("storage_unique_ids");'
  );
};

exports.down = async function(knex) {
  await knex.schema.dropIndex(null, 'shares_storage_unique_ids_index');
  await knex.schema.dropTable('shares');
};
