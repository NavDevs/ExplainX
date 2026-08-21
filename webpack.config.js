const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    popup: './src/popup.ts',
    options: './src/options.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'src/popup.html', to: '.' },
        { from: 'src/options.html', to: '.' },
        { from: 'src/styles/popup.css', to: 'styles/popup.css', noErrorOnMissing: true },
        { from: 'src/styles/options.css', to: 'styles/options.css', noErrorOnMissing: true },
        { from: 'src/styles/content.css', to: 'styles/content.css', noErrorOnMissing: true },
        { from: 'src/styles/ai-chat.css', to: 'styles/ai-chat.css', noErrorOnMissing: true },
        { from: 'src/icons', to: 'icons', noErrorOnMissing: true },
      ],
    }),
  ],
};
