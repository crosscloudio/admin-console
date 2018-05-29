'use strict';

const path = require('path');

const srcPath = path.join(__dirname, '/../src');

function getDefaultModules() {
  return {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.less/,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
      {
        test: /\.(png|jpg|gif|woff|woff2).*$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
          },
        },
      },
      {
        test: /\.(mp4|ogg|eot|ttf|svg).*$/,
        use: 'file-loader',
      },
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        use: 'graphql-tag/loader',
      },
    ],
  };
}
module.exports = {
  srcPath,
  publicPath: '/assets/',
  getDefaultModules,
  postcss() {
    return [];
  },
};
