const webpack = require('webpack');
const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
    entry: [ 'babel-polyfill', './src/gen.worker.js', './src/main.js' ],
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        publicPath: `/v2/run/${process.env.BINARIS_ACCOUNT_NUMBER}/public_fractal/js/`,
        filename: 'three.bundle.js'
    },
    module: {
        rules: [
            {
              test: /\.worker\.js$/,
              include: /(src)/,
              use: { loader: 'worker-loader' }
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                include: /(src)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            },
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
        new webpack.DefinePlugin(
          {
              'process.env':
              {
                    'FRACTAL_ENDPOINT': JSON.stringify(process.env.FRACTAL_ENDPOINT),
              }
          }
        ),
    ],
}
