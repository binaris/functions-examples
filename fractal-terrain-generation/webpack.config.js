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
        new BrowserSyncPlugin(
            {
                cors: true,
                host: 'localhost',
                port: 3001,
                proxy: 'http://localhost:8080/',
                files: [
                    {
                        match: ['**/*.html'],
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
                    'FRACTAL_ENDPOINT': JSON.stringify(process.env.FRACTAL_ENDPOINT),
              }
          }
        ),
    ],
    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        publicPath: `/v2/run/${process.env.BINARIS_ACCOUNT_NUMBER}/public_fractal/js/`,
    },
    watch: true,
    devtool: 'cheap-eval-source-map'
}
