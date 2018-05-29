exports.up = async function(knex) {
  // CITEXT extension used for storing email adresses and organization names
  await knex.schema.raw('CREATE EXTENSION IF NOT EXISTS citext');

  await knex.schema.createTable('organizations', table => {
    table.bigIncrements();
    table.specificType('display_name', 'citext').notNullable().unique();
    table.boolean('encryption_enabled').notNullable().defaultTo(true);
    table.string('encryption_password').notNullable().defaultTo('');
    table.string('encryption_master_key');
    table.string('encryption_salt');
    table.timestamps(false, true);
  });

  await knex.schema.createTable('users', table => {
    table.bigIncrements();
    table.specificType('email', 'citext').notNullable().unique();
    table
      .bigInteger('organization_id')
      .notNullable()
      .unsigned()
      .references('organizations.id');
    table.string('password_hash');
    table.string('machine_id');
    table.string('image').notNullable().defaultTo('http://placehold.it/300');
    table.boolean('is_enabled').notNullable().defaultTo('true');
    table.timestamp('last_request_time');
    table.specificType('last_request_ip', 'inet');
    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('users');
  await knex.schema.dropTable('organizations');
  await knex.schema.raw('DROP EXTENSION citext');
};
