exports.up = async function(knex) {
  await knex.schema.table('users', table => {
    table
      .specificType('roles', 'text[]')
      .notNullable()
      .defaultTo(knex.raw('array[]::text[]'));
  });
};

exports.down = async function(knex) {
  await knex.schema.table('users', table => {
    table.dropColumn('roles');
  });
};
