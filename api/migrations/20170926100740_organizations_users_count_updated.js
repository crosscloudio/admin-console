exports.up = async function(knex) {
  await knex.raw(`
    UPDATE organizations SET users_count = (
      SELECT count(*) FROM users
        WHERE users.organization_id = organizations.id
          AND is_resellers_admin = false
    );
  `);

  await knex.raw(`
    DROP TRIGGER update_organizations_users_count ON users;
    DROP FUNCTION counter_cache_uuid();
    DROP FUNCTION increment_counter_uuid(table_name text, column_name text, id uuid, step integer);
  `);

  // based on http://shuber.io/porting-activerecord-counter-cache-behavior-to-postgres/
  await knex.raw(`
CREATE FUNCTION increment_counter_users(table_name text, column_name text, id uuid, step integer)
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

CREATE FUNCTION counter_cache_users()  
  RETURNS trigger AS $$
    DECLARE
      table_name text := quote_ident(TG_ARGV[0]);
      counter_name text := quote_ident(TG_ARGV[1]);
      fk_name text := quote_ident(TG_ARGV[2]);
      fk_changed boolean := false;
      fb_is_resellers_admin boolean;
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
        EXECUTE 'SELECT ($1).is_resellers_admin' INTO fb_is_resellers_admin USING record;
        IF NOT fb_is_resellers_admin THEN
          EXECUTE 'SELECT ($1).' || fk_name INTO fk_value USING record;
          PERFORM increment_counter_users(table_name, counter_name, fk_value, -1);
        END IF;
      END IF;

      IF TG_OP = 'INSERT' OR fk_changed THEN
        record := NEW;
        EXECUTE 'SELECT ($1).is_resellers_admin' INTO fb_is_resellers_admin USING record;
        IF NOT fb_is_resellers_admin THEN
          EXECUTE 'SELECT ($1).' || fk_name INTO fk_value USING record;
          PERFORM increment_counter_users(table_name, counter_name, fk_value, 1);
        END IF;
      END IF;

      RETURN record;
    END;
  $$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_users_count  
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE PROCEDURE counter_cache_users('organizations', 'users_count', 'organization_id');
  `);
};

exports.down = async function(knex) {
  await knex.raw(`
    DROP TRIGGER update_organizations_users_count ON users;
    DROP FUNCTION increment_counter_users(table_name text, column_name text, id uuid, step integer);
    DROP FUNCTION counter_cache_users();
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
