'use strict';

const path = require('path');
const webpack = require('webpack');

const baseConfig = require('./base');
const defaultSettings = require('./defaults');

const config = Object.assign({}, baseConfig, {
  entry: path.join(__dirname, '../src/index'),
  cache: false,
  devtool: 'sourcemap',
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      comments: false,
      compress: {
        screw_ie8: true,
        warnings: false,
      },
      mangle: {
        screw_ie8: true,
      },
      sourceMap: true,
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  module: defaultSettings.getDefaultModules(),
});

// Add needed rules to the defaults here
config.module.rules.push({
  test: /\.(js|jsx)$/,
  use: 'babel-loader',
  include: path.join(__dirname, '/../src'),
});

module.exports = config;
