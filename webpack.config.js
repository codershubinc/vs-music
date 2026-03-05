//@ts-check

'use strict';

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

// @ts-ignore
module.exports = (env, argv) => {
  const isLinux = env && env.platform === 'linux';
  console.log("is linux", isLinux);


  /** @type WebpackConfig */
  const extensionConfig = {
    target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

    entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
      // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2',
      clean: true
    },
    externals: {
      vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
      x11: 'commonjs x11' // optional dependency of dbus-next; not needed at runtime on standard DBus sockets
    },
    resolve: {
      // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader'
            }
          ]
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          // Copy whole CSS folder and keep folder structure under dist/src/common/ui/webview/static/css/
          {
            from: 'src/common/ui/webview/static/css/**/*',
            to: '[path][name][ext]',
            noErrorOnMissing: true
          },
          {
            from: 'src/common/ui/webview/themes/**/*',
            to: '[path][name][ext]',
            noErrorOnMissing: true
          }
          ,
          // Copy all JS files under utils/ recursively and preserve subfolders (helpers/, etc.)
          {
            from: 'src/common/ui/webview/static/js/utils/**/*',
            to: '[path][name][ext]',
            noErrorOnMissing: true
          },
          {
            from: 'src/common/ui/webview/musicPlayer.html',
            to: 'src/common/ui/webview/musicPlayer.html',
            noErrorOnMissing: true
          },
          // Copy QuazaarMedia.exe
          ...(isLinux ? [] : [{
            from: 'src/windows/QuazaarMedia.exe',
            to: 'src/windows/QuazaarMedia.exe',
            noErrorOnMissing: true
          }])
        ]
      })
    ],
    devtool: 'nosources-source-map',
    infrastructureLogging: {
      level: "log", // enables logging required for problem matchers
    },
  };
  return [extensionConfig];
};
