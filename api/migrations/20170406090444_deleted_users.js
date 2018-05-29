const USER_RELATED_TABLES = [
  'approval_requests',
  'cloud_storages',
  'encrypted_user_key_data',
  'share_keys',
  'sync_rules',
];

exports.up = async function(knex) {
  await knex.schema.createTable('deleted_users', table => {
    table.uuid('id').unique().notNullable();
    table.uuid('organization_id').references('organizations.id');
    table.specificType('email', 'citext').notNullable();
    table.string('password_hash');
    table.string('machine_id');
    table.string('image').notNullable();
    table.boolean('is_enabled').notNullable();
    table.timestamp('last_request_time');
    table.specificType('last_request_ip', 'inet');
    table.specificType('roles', 'text[]');
    table.string('name');
    table.text('public_key');
    table.timestamp('last_login');
    table.timestamp('original_created_at');
    table.timestamp('original_updated_at');
    table.timestamps(false, true);

    table
      .specificType('share_keys', 'jsonb[]')
      .defaultTo(knex.raw('array[]::jsonb[]'));
  });

  await knex.raw(`
    ALTER TABLE activity_logs DROP CONSTRAINT activity_logs_user_id_foreign;
  `);

  for (const tableName of USER_RELATED_TABLES) {
    await knex.raw(`
      ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_user_id_foreign;
      ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_user_id_foreign
        FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE;
    `);
  }
};

exports.down = async function(knex) {
  for (const tableName of USER_RELATED_TABLES) {
    await knex.raw(`
      ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_user_id_foreign;
      ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_user_id_foreign
        FOREIGN KEY (user_id)
        REFERENCES users (id);
    `);
  }
  await knex.raw(`
    ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_user_id_foreign
      FOREIGN KEY (user_id)
      REFERENCES users (id);
  `);
  await knex.schema.dropTable('deleted_users');
};
