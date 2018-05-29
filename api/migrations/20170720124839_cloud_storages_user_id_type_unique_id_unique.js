exports.up = async function(knex) {
  await knex.schema.table('cloud_storages', table => {
    table.unique(['user_id', 'type', 'unique_id']);
    table.dropUnique(['user_id', 'unique_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('cloud_storages', table => {
    table.unique(['user_id', 'unique_id']);
    table.dropUnique(['user_id', 'type', 'unique_id']);
  });
};
