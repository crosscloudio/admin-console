exports.up = async function(knex) {
  await knex.schema.table('users', table => {
    table.string('name').notNullable().defaultTo('unnamed');
  });
  // drop temporary default name
  await knex.raw('ALTER TABLE users ALTER COLUMN name DROP DEFAULT');
};

exports.down = async function(knex) {
  await knex.schema.table('users', table => {
    table.dropColumn('name');
  });
};
