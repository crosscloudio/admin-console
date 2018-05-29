exports.up = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.text('encryption_master_key');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropColumn('encryption_master_key');
  });
};
