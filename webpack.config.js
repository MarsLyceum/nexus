const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    return {
        ...config,
        entry: './index.web.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].[contenthash].js',
            chunkFilename: '[name].[contenthash].js',
        },
        resolve: {
            alias: {
                ...(config.resolve.alias || {}),
                'react-native$': 'react-native-web',
                'react-native-web/dist/exports/PermissionsAndroid':
                    path.resolve(__dirname, 'src/mocks/PermissionsAndroid.js'),
            },
            extensions: ['.js', '.jsx', '.web.js', '.ts', '.tsx'],
            fallback: {
                ...(config.resolve.fallback || {}),
                module: require.resolve('module/'),
                stream: require.resolve('stream-browserify'),
                assert: require.resolve('assert'),
                util: require.resolve('util'),
                url: require.resolve('url'),
                buffer: require.resolve('buffer'),
                repl: false,
                vm: require.resolve('vm-browserify'),
                os: require.resolve('os-browserify/browser'),
                console: require.resolve('console-browserify'),
                fs: false,
                crypto: require.resolve('crypto-browserify'),
                constants: require.resolve('constants-browserify'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx|ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                'babel-preset-expo',
                                'module:metro-react-native-babel-preset',
                                '@babel/preset-env',
                                '@babel/preset-react',
                                '@babel/preset-typescript',
                            ],
                            plugins: [
                                '@babel/plugin-transform-class-properties',
                                '@babel/plugin-transform-private-methods',
                                '@babel/plugin-transform-private-property-in-object',
                                '@babel/plugin-syntax-dynamic-import',
                                '@babel/plugin-proposal-object-rest-spread',
                            ],
                        },
                    },
                },
                {
                    test: /\.(png|jpe?g|gif)$/i,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: '[path][name].[ext]',
                            },
                        },
                    ],
                },
                {
                    test: /\.(woff(2)?|eot|ttf|otf|svg)$/i,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 8192,
                                name: '[path][name].[ext]',
                            },
                        },
                    ],
                },
            ],
        },

        plugins: [
            ...(config.plugins || []),
            new CleanWebpackPlugin(),
            new webpack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer'],
            }),
            new HtmlWebpackPlugin({
                template: './public/index.html',
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
        ],
    };
};
