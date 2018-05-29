exports.up = async function(knex) {
  await knex.schema.createTable('share_keys', table => {
    table.bigIncrements();

    table
      .bigInteger('user_id')
      .notNullable()
      .unsigned()
      .references('users.id')
      .onDelete('CASCADE');
    table
      .bigInteger('share_id')
      .notNullable()
      .unsigned()
      .references('shares.id')
      .onDelete('CASCADE');
    table.text('encrypted_share_key').notNullable();
    table.unique(['user_id', 'share_id']);

    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('share_keys');
};
