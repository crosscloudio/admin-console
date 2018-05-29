exports.up = async function(knex) {
  await knex.schema.table('users', table => {
    table.timestamp('last_login');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('users', table => {
    table.dropColumn('last_login');
  });
};
