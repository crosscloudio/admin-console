exports.up = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.timestamp('deleted_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropColumn('deleted_at');
  });
};
