exports.up = async function(knex) {
  await knex.schema.table('resellers', table => {
    table.string('external_id');
  });

  await knex.raw(
    'ALTER TABLE resellers ALTER COLUMN id SET DEFAULT uuid_generate_v4()'
  );
};

exports.down = async function(knex) {
  await knex.raw('ALTER TABLE resellers ALTER COLUMN id DROP DEFAULT');

  await knex.schema.table('resellers', table => {
    table.dropColumn('external_id');
  });
};
