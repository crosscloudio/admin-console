exports.up = async function(knex) {
  await knex.schema.table('activity_logs', table => {
    table.renameColumn('file_extension', 'mime_type');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('activity_logs', table => {
    table.renameColumn('mime_type', 'file_extension');
  });
};
