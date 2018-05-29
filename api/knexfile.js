// Make all migrations babelified
require('babel-register');

const DB_SETTINGS = require('./src/utils/knexSettings').default;

module.exports = {
  development: DB_SETTINGS,
  staging: DB_SETTINGS,
  production: DB_SETTINGS,
};
