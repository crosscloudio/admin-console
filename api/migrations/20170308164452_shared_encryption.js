exports.up = async function(knex) {
  await knex.schema.createTable('encrypted_user_key_data', table => {
    table.bigIncrements();

    table.bigInteger('user_id').notNullable().unsigned().references('users.id');
    table.string('device_id').notNullable();
    table.text('public_device_key').notNullable();
    table.text('encrypted_user_key').notNullable();
    table.unique(['user_id', 'device_id']);

    table.timestamps(false, true);
  });

  await knex.schema.createTable('approval_requests', table => {
    table.bigIncrements();

    table.bigInteger('user_id').notNullable().unsigned().references('users.id');
    table.string('device_id').notNullable();
    table.text('public_device_key').notNullable();
    table.unique(['user_id', 'device_id']);

    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('approval_requests');
  await knex.schema.dropTable('encrypted_user_key_data');
};
