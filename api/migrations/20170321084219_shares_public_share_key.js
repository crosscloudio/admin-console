exports.up = async function(knex) {
  await knex.schema.table('shares', table => {
    table.text('public_share_key');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('shares', table => {
    table.dropColumn('public_share_key');
  });
};
