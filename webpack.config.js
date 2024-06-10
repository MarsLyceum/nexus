const path = require('path');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'react-native-web/dist/exports/PermissionsAndroid': path.resolve(
            __dirname,
            'src/mocks/PermissionsAndroid.js'
        ),
        '@reduxjs/toolkit/src': path.resolve(
            __dirname,
            'node_modules/@reduxjs/toolkit/src'
        ),
    };

    config.plugins = [
        ...(config.plugins || []),
        new NodePolyfillPlugin({
            excludeAliases: ['console'],
        }),
    ];

    config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        crypto: require.resolve('crypto-browserify'),
    };

    // Add .cjs and .mjs to the list of file extensions webpack will resolve
    config.resolve.extensions = [
        ...(config.resolve.extensions || []),
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.cjs',
        '.mjs',
    ];

    // Ensure loaders handle .cjs and .mjs files
    config.module.rules.push(
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
            test: /\.cjs$/,
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
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto',
        }
    );

    return config;
};
