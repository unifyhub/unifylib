const path = require('path');
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: {
    first: './src/index.js',
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/gas'),
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
    alias: {
      '@unify': path.resolve(__dirname, 'src/unify/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'buble-loader',
          options: {
            presets: ['@babel/preset-env'],
            transforms: {
              asyncAwait: false,
              modules: false,
            },
          },
        },
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './src/appsscript.json', to: './' },
        { from: './src/vendor/lodash.js', to: './' },
      ],
    }),
    new Serve(),
  ],
};
