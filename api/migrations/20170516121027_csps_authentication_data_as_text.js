exports.up = async function(knex) {
  await knex.schema.table('cloud_storages', table => {
    table.text('authentication_data_text');
  });
  await knex.raw(`
    UPDATE cloud_storages SET authentication_data_text = authentication_data::text;
    ALTER TABLE cloud_storages DROP COLUMN authentication_data;
    ALTER TABLE cloud_storages RENAME COLUMN authentication_data_text TO authentication_data;
  `);
};

exports.down = async function(knex) {
  await knex.schema.table('cloud_storages', table => {
    table.jsonb('authentication_data_json');
  });
  await knex.raw(`
    UPDATE cloud_storages SET authentication_data_json = authentication_data::json;
    ALTER TABLE cloud_storages DROP COLUMN authentication_data;
    ALTER TABLE cloud_storages RENAME COLUMN authentication_data_json TO authentication_data;
  `);
};
