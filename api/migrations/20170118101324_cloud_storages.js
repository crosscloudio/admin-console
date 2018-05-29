exports.up = async function(knex) {
  await knex.schema.createTable('cloud_storages', table => {
    table.bigIncrements();
    table.bigInteger('user_id').notNullable().unsigned().references('users.id');
    table.text('display_name').notNullable();
    table.text('type').notNullable();
    table.text('unique_id').notNullable();
    table.unique(['user_id', 'unique_id']);
    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('cloud_storages');
};
