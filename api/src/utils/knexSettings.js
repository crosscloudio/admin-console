let PG_URL = process.env.DATABASE_URL || 'postgres://postgres:@db/postgres';

// required for heroku
if (process.env.DATABASE_FORCE_SSL) {
  PG_URL += '?ssl=true';
}

export default {
  client: 'pg',
  connection: PG_URL,
  migrations: {
    tableName: 'knex_migrations',
  },
};
