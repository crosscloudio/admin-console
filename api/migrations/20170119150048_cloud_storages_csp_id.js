exports.up = async function(knex) {
  // WARNING: this migrations deletes all instances of cloud storages
  await knex('cloud_storages').delete();
  await knex.schema.table('cloud_storages', table => {
    table.text('csp_id').notNullable();
    table.unique(['user_id', 'csp_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('cloud_storages', table => {
    table.dropUnique(['user_id', 'csp_id']);
    table.dropColumn('csp_id');
  });
};
