exports.up = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.integer('users_count').notNull().defaultTo(0);
    table.integer('users_limit').notNull().defaultTo(3);
  });

  await knex.raw(`
    UPDATE organizations SET users_count = (
      SELECT count(*) FROM users WHERE users.organization_id = organizations.id
    ), users_limit=50;
`);

  await knex.raw(`
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_check_users_count_lte_users_limit
    CHECK (users_count <= users_limit);
  `);

  // based on http://shuber.io/porting-activerecord-counter-cache-behavior-to-postgres/
  await knex.raw(`
CREATE FUNCTION increment_counter_uuid(table_name text, column_name text, id uuid, step integer)
  RETURNS VOID AS $$
    DECLARE
      table_name text := quote_ident(table_name);
      column_name text := quote_ident(column_name);
      conditions text := ' WHERE id = $1';
      updates text := column_name || '=' || column_name || '+' || step;
    BEGIN
      EXECUTE 'UPDATE ' || table_name || ' SET ' || updates || conditions
      USING id;
    END;
  $$ LANGUAGE plpgsql;

CREATE FUNCTION counter_cache_uuid()  
  RETURNS trigger AS $$
    DECLARE
      table_name text := quote_ident(TG_ARGV[0]);
      counter_name text := quote_ident(TG_ARGV[1]);
      fk_name text := quote_ident(TG_ARGV[2]);
      fk_changed boolean := false;
      fk_value uuid;
      record record;
    BEGIN
      IF TG_OP = 'UPDATE' THEN
        record := NEW;
        EXECUTE 'SELECT ($1).' || fk_name || ' != ' || '($2).' || fk_name
        INTO fk_changed
        USING OLD, NEW;
      END IF;

      IF TG_OP = 'DELETE' OR fk_changed THEN
        record := OLD;
        EXECUTE 'SELECT ($1).' || fk_name INTO fk_value USING record;
        PERFORM increment_counter_uuid(table_name, counter_name, fk_value, -1);
      END IF;

      IF TG_OP = 'INSERT' OR fk_changed THEN
        record := NEW;
        EXECUTE 'SELECT ($1).' || fk_name INTO fk_value USING record;
        PERFORM increment_counter_uuid(table_name, counter_name, fk_value, 1);
      END IF;

      RETURN record;
    END;
  $$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_users_count  
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE PROCEDURE counter_cache_uuid('organizations', 'users_count', 'organization_id');
  `);
};

exports.down = async function(knex) {
  await knex.raw(`
    DROP TRIGGER update_organizations_users_count ON users;
    DROP FUNCTION counter_cache_uuid();
    DROP FUNCTION increment_counter_uuid(table_name text, column_name text, id uuid, step integer);
  `);
  await knex.raw(`
    ALTER TABLE organizations
    DROP CONSTRAINT organizations_check_users_count_lte_users_limit;
  `);
  await knex.schema.table('organizations', table => {
    table.dropColumn('users_limit');
    table.dropColumn('users_count');
  });
};
