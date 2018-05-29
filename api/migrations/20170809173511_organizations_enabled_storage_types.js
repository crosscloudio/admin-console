exports.up = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.specificType('enabled_storage_types', 'text[]');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropColumn('enabled_storage_types');
  });
};
