/* eslint no-console:0 */

'use strict';

require('core-js/fn/object/assign');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');

const port = config.devServer.port;

new WebpackDevServer(
  webpack(config),
  config.devServer
).listen(port, '0.0.0.0', err => {
  if (err) {
    console.log(err);
  }
  console.log(`Listening at 0.0.0.0:${port}`);
});
