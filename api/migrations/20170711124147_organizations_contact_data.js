exports.up = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.text('admin_phone');
    table.specificType('admin_email', 'citext');
    table.text('billing_phone');
    table.specificType('billing_email', 'citext');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('organizations', table => {
    table.dropColumn('billing_email');
    table.dropColumn('billing_phone');
    table.dropColumn('admin_email');
    table.dropColumn('admin_phone');
  });
};
