exports.up = async function(knex) {
  await knex.schema.table('users', table => {
    table.text('public_key');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('users', table => {
    table.dropColumn('public_key');
  });
};
