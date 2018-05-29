exports.up = async function(knex) {
  await knex.raw(
    'ALTER TABLE ONLY organizations ALTER COLUMN encryption_enabled SET DEFAULT false'
  );
};

exports.down = async function(knex) {
  await knex.raw(
    'ALTER TABLE ONLY organizations ALTER COLUMN encryption_enabled SET DEFAULT true'
  );
};
