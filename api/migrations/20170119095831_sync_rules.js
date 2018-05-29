exports.up = async function(knex) {
  await knex.schema.createTable('sync_rules', table => {
    table.bigIncrements();
    table.bigInteger('user_id').notNullable().unsigned().references('users.id');
    table.text('path').notNullable();
    table.specificType('csp_ids', 'text[]').notNullable();
    table.unique(['user_id', 'path']);
    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('sync_rules');
};
