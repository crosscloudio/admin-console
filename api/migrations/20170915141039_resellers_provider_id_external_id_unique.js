exports.up = async function(knex) {
  await knex.schema.table('resellers', table => {
    table.unique(['provider_id', 'external_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('resellers', table => {
    table.dropUnique(['provider_id', 'external_id']);
  });
};
