exports.up = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropColumn('encryption_password');
    table.dropColumn('encryption_master_key');
    table.dropColumn('encryption_salt');
    table.boolean('encrypt_external_shares').notNullable().defaultTo(false);
    table.boolean('encrypt_public_shares').notNullable().defaultTo(true);
    table
      .specificType('encryption_csps_settings', 'jsonb[]')
      .defaultTo(knex.raw('array[]::jsonb[]'));
  });
};

exports.down = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropColumn('encrypt_external_shares');
    table.dropColumn('encrypt_public_shares');
    table.dropColumn('encryption_csps_settings');
    table.string('encryption_password').notNullable().defaultTo('');
    table.string('encryption_master_key');
    table.string('encryption_salt');
  });
};
