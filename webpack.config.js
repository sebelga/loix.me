/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');

module.exports = (env) => {
    if (typeof env === 'undefined' || typeof env.NODE_ENV === 'undefined') {
        console.error('[Error] env is not set.');
        process.exit(1);
    }

    const define = new webpack.DefinePlugin({
        env: {
            NODE_ENV: JSON.stringify(env.NODE_ENV),
        },
    });

    const extractCSS = new ExtractTextPlugin({
        filename: getPath => getPath('css/[name].[contenthash:8].css').replace('css', '../css'),
    });

    const assetsManifest = new AssetsPlugin({
        filename: 'assets.json',
        path: path.join(__dirname, 'data'),
        fullPath: false,
        processOutput: (assets) => {
            Object.keys(assets).forEach((bundle) => {
                Object.keys(assets[bundle]).forEach((type) => {
                    const filename = assets[bundle][type];
                    assets[bundle][type] = filename.slice(filename.indexOf(bundle));
                });
            });
            return JSON.stringify(assets, null, 4);
        },
    });

    const cleanBuild = new CleanWebpackPlugin([
        'static/assets/css/*',
        'static/assets/js/*',
    ]);

    const config = {
        entry: {
            main: path.join(__dirname, 'src/scripts', 'main.js'),
        },
        output: {
            filename: '[name].[chunkhash:8].js',
            path: path.join(__dirname, 'static', 'assets', 'js'),
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    include: path.join(__dirname, 'src/scripts'),
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015'],
                        },
                    },
                },
                {
                    test: /\.scss$/,
                    include: path.join(__dirname, 'src/styles'),
                    loader: extractCSS.extract({
                        use: [
                            {
                                loader: 'css-loader?sourceMap',
                                options: {
                                    importLoaders: 1,
                                },
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    plugins: [
                                        autoprefixer({
                                            browsers: ['> 1%', 'last 2 versions'],
                                        }),
                                    ],
                                },
                            },
                            'resolve-url-loader',
                            'sass-loader?sourceMap',
                        ],
                    }),
                },
                {
                    test: /\.jpe?g$|\.gif$|\.png$/i,
                    loader: 'file-loader?name=/assets/img/[name].[ext]',
                },
            ],
        },
        resolve: {
            extensions: ['*', '.js', '.scss'],
        },
        plugins: [define, extractCSS, assetsManifest],
    };

    if (env.NODE_ENV === 'prod') {
        config.plugins.push(cleanBuild);
    }

    return config;
};

