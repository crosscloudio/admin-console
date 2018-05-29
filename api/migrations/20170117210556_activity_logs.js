exports.up = async function(knex) {
  await knex.schema.createTable('activity_logs', table => {
    table.bigIncrements();
    table
      .bigInteger('organization_id')
      .notNullable()
      .unsigned()
      .references('organizations.id');
    table.bigInteger('user_id').notNullable().unsigned().references('users.id');
    table.text('type').notNullable();
    table.timestamp('timestamp').notNullable();
    table.specificType('path', 'text[]').notNullable();
    table.boolean('encrypted').notNullable().defaultTo(false);
    table.boolean('shared').notNullable().defaultTo(false);
    table.bigInteger('bytes_transferred');
    table.text('storage_id');
    table.text('file_extension').notNullable().defaultTo('folder');
    table.text('status').notNullable().defaultTo('success');
    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('activity_logs');
};
