exports.up = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropUnique('display_name');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.unique('display_name');
  });
};
