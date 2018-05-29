exports.up = async function(knex) {
  await knex.schema.table('cloud_storages', table => {
    table.jsonb('authentication_data');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('cloud_storages', table => {
    table.dropColumn('authentication_data');
  });
};
