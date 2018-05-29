exports.up = async function(knex) {
  await knex.schema.createTable('policies', table => {
    table.bigIncrements();
    table
      .bigInteger('organization_id')
      .notNullable()
      .unsigned()
      .references('organizations.id');
    table.text('name').notNullable();
    table.text('type').notNullable();
    table.text('criteria').notNullable();
    table.boolean('is_enabled').notNullable().defaultTo('true');
    table.unique(['organization_id', 'name']);
    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('policies');
};
