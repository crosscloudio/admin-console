'use strict';

const path = require('path');
const webpack = require('webpack');
const baseConfig = require('./base');
const defaultSettings = require('./defaults');

const devServerDomain = process.env.WEBPACK_DEV_SERVER_DOMAIN || '127.0.0.1';

const config = Object.assign({}, baseConfig, {
  entry: [
    `webpack-dev-server/client?http://${devServerDomain}:8000`,
    'webpack/hot/dev-server',
    'babel-polyfill',
    './src/index',
  ],
  cache: true,
  devtool: 'source-map',
  plugins: [
    ...baseConfig.plugins,
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  module: defaultSettings.getDefaultModules(),
});

// Add needed rules to the defaults here
config.module.rules.push({
  test: /\.(js|jsx)$/,
  use: ['react-hot-loader', 'babel-loader'],
  include: path.join(__dirname, '/../src'),
});

config.devServer.proxy = {
  '/graphql': {
    target: 'http://api:3030',
    secure: false,
  },
  '/graphiql': {
    target: 'http://api:3030',
    secure: false,
  },
  '/auth/*': {
    target: 'http://api:3030',
    secure: false,
  },
  '/resellers/*': {
    target: 'http://api:3030',
    secure: false,
  },
};

module.exports = config;
