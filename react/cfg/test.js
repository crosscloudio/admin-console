'use strict';

const path = require('path');

const srcPath = path.join(__dirname, '/../src/');

module.exports = {
  devtool: 'eval',
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|woff|woff2|css|sass|scss|less|styl)$/,
        use: 'null-loader',
      },
      {
        test: /\.(js|jsx)$/,
        use: 'babel-loader',
        include: [
          path.join(__dirname, '/../src'),
          path.join(__dirname, '/../test'),
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      actions: `${srcPath}actions/`,
      helpers: path.join(__dirname, '/../test/helpers'),
      components: `${srcPath}components/`,
      sources: `${srcPath}sources/`,
      stores: `${srcPath}stores/`,
      styles: `${srcPath}styles/`,
      config: `${srcPath}config/${process.env.REACT_WEBPACK_ENV}`,
    },
  },
};
