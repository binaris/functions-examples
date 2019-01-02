const webpack = require('webpack');
const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const fs = require('mz/fs');
const dot = require('dot');

const { prebuild } = require('./builder');
const localResourceEndpoint = 'http://localhost:3001';

module.exports = async () => {
  const { FRACTAL_ENDPOINT, PUBLIC_PATH, BINARIS_ACCOUNT_ID } = await prebuild();
  return {
    entry: [ 'babel-polyfill', './src/gen.worker.js', './src/main.js' ],
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        publicPath: `${PUBLIC_PATH}/js`,
        filename: 'three.bundle.js'
    },
    module: {
        rules: [
            {
              test: /\.worker\.js$/,
              use: { loader: 'worker-loader' }
            },
            {
                test: /\.js$/,
                include: /(src)/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                } },
            {
                test: /\.(glsl|frag|vert)$/,
                loader: 'raw-loader',
                include: /(src)/,
                exclude: /node_modules/
            },
            {
                test: /\.(glsl|frag|vert)$/,
                loader: 'glslify-loader',
                include: /(src)/,
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new webpack.NamedModulesPlugin(),
        new BrowserSyncPlugin(
            {
                cors: true,
                host: 'localhost',
                port: 3001,
                proxy: 'http://localhost:8080/',
                files: [
                    {
                        match: ['**/*.html*'],
                        fn: event => {
                            if (event === 'change') {
                                const bs = require('browser-sync').get(
                                    'bs-webpack-plugin'
                                )
                                bs.reload()
                            }
                        }
                    }
                ]
            },
            {
                reload: false
            }
        ),
        new webpack.DefinePlugin(
          {
              'process.env':
              {
                    FRACTAL_ENDPOINT: JSON.stringify(FRACTAL_ENDPOINT),
                    FRACTAL_RESOURCE_ENDPOINT: JSON.stringify(localResourceEndpoint),
              }
          }
        ),
    ],
    devServer: {
        before: function(app, server) {
          app.get(['/', '/index.html'], async (req, res) => {
            const file = await fs.readFile(__dirname + '/dist/index.html.dot', 'utf8');
            const template = dot.template(file);
            res.set('content-type', 'text/html');
            res.send(template({ binarisAccountId: BINARIS_ACCOUNT_ID }));
          });
        },
        contentBase: [path.resolve(__dirname, 'dist'), path.resolve(__dirname, 'dist/resources')],
        publicPath: `${PUBLIC_PATH}/js`,
    },
    watch: true,
    devtool: 'cheap-eval-source-map'
  };
}
