'use strict';

const path = require('path');

const defaultSettings = require('./defaults');

const config = {
  devtool: 'eval',
  output: {
    path: path.join(__dirname, '/../dist/assets'),
    filename: 'app.js',
    publicPath: defaultSettings.publicPath,
  },
  devServer: {
    contentBase: './src/',
    historyApiFallback: {
      disableDotRule: true,
    },
    hot: true,
    port: 8000,
    publicPath: defaultSettings.publicPath,
    noInfo: false,
    // Running behind nginx proxy
    disableHostCheck: true,
  },
  plugins: [],
  resolve: {
    extensions: ['.js', '.jsx', '.less'],
    alias: {
      actions: `${defaultSettings.srcPath}/actions/`,
      components: `${defaultSettings.srcPath}/components/`,
      config: `${defaultSettings.srcPath}/config/${process.env
        .REACT_WEBPACK_ENV}`,
      constants: `${defaultSettings.srcPath}/constants/`,
      mutations: `${defaultSettings.srcPath}/mutations/`,
      queries: `${defaultSettings.srcPath}/queries/`,
      stores: `${defaultSettings.srcPath}/stores/`,
      styles: `${defaultSettings.srcPath}/styles/`,
      utils: `${defaultSettings.srcPath}/utils/`,
    },
  },
  module: {},
};

if (process.env.WEBPACK_USE_POOLING) {
  config.devServer.watchOptions = config.devServer.watchOptions || {};
  Object.assign(config.devServer.watchOptions, {
    aggregateTimeout: 300,
    poll: 1000,
  });
}

module.exports = config;
