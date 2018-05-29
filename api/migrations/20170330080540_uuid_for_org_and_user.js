const ORGANIZATION_RELATED_TABLES = [
  'users',
  'policies',
  'activity_logs',
  'shares',
];

const USER_RELATED_TABLES = [
  'activity_logs',
  'cloud_storages',
  'sync_rules',
  'encrypted_user_key_data',
  'approval_requests',
  'share_keys',
];

exports.up = async function(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  await knex.schema.table('organizations', table => {
    table.renameColumn('id', '_id');
  });
  await knex.schema.table('organizations', table => {
    table
      .uuid('id')
      .unique()
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'));
  });
  await knex.schema.table('users', table => {
    table.renameColumn('id', '_id');
  });
  await knex.schema.table('users', table => {
    table
      .uuid('id')
      .unique()
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'));
  });

  for (const tableName of ORGANIZATION_RELATED_TABLES) {
    await knex.schema.table(tableName, table => {
      table.renameColumn('organization_id', '_organization_id');
    });
    await knex.schema.table(tableName, table => {
      table.dropForeign('organization_id');
    });
  }

  await knex.raw(`
    ALTER TABLE organizations DROP CONSTRAINT organizations_pkey;
    ALTER TABLE organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
    ALTER TABLE organizations DROP CONSTRAINT organizations_id_unique;
  `);

  for (const tableName of ORGANIZATION_RELATED_TABLES) {
    await knex.schema.table(tableName, table => {
      table.uuid('organization_id').references('organizations.id');
    });
    // no risk for sql-injection here
    await knex.raw(`
      UPDATE ${tableName}
      SET organization_id = (
        SELECT organizations.id FROM organizations
        WHERE organizations._id = ${tableName}._organization_id
      );
      ALTER TABLE ${tableName} ALTER COLUMN organization_id SET NOT NULL;
      ALTER TABLE ${tableName} DROP COLUMN _organization_id;
    `);
  }

  await knex.raw(`
    ALTER TABLE organizations DROP COLUMN _id;
  `);

  await knex.schema.table('policies', table => {
    table.unique(['organization_id', 'name']);
  });

  await knex.schema.table('shares', table => {
    table.unique(['organization_id', 'storage_type', 'unique_id']);
  });

  for (const tableName of USER_RELATED_TABLES) {
    await knex.schema.table(tableName, table => {
      table.renameColumn('user_id', '_user_id');
    });
    await knex.schema.table(tableName, table => {
      table.dropForeign('user_id');
    });
  }

  await knex.raw(`
    ALTER TABLE users DROP CONSTRAINT users_pkey;
    ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    ALTER TABLE users DROP CONSTRAINT users_id_unique;
  `);

  for (const tableName of USER_RELATED_TABLES) {
    await knex.schema.table(tableName, table => {
      table.uuid('user_id').references('users.id');
    });
    // no risk for sql-injection here
    await knex.raw(`
      UPDATE ${tableName}
      SET user_id = (
        SELECT users.id FROM users
        WHERE users._id = ${tableName}._user_id
      );
      ALTER TABLE ${tableName} ALTER COLUMN user_id SET NOT NULL;
      ALTER TABLE ${tableName} DROP COLUMN _user_id;
    `);
  }

  await knex.raw(`
    ALTER TABLE users DROP COLUMN _id;
  `);

  await knex.schema.table('cloud_storages', table => {
    table.unique(['user_id', 'unique_id']);
    table.unique(['user_id', 'csp_id']);
  });

  await knex.schema.table('sync_rules', table => {
    table.unique(['user_id', 'path']);
  });

  await knex.schema.table('encrypted_user_key_data', table => {
    table.unique(['user_id', 'device_id']);
  });

  await knex.schema.table('approval_requests', table => {
    table.unique(['user_id', 'device_id']);
  });

  await knex.schema.table('share_keys', table => {
    table.unique(['user_id', 'share_id']);
  });
};

exports.down = async function() {
  throw new Error('Not supported');
};
