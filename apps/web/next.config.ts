const { withExpo } = require('@expo/next-adapter');

const path = require('path');
const webpack = require('webpack');
const DirectoryNamedWebpackPlugin = require('directory-named-webpack-plugin');

const polyfillPath = path.resolve(__dirname, 'polyfills/expo-polyfills.ts');
const ReplaceUseLayoutEffectPlugin = require('./plugins/ReplaceUseLayoutEffectPlugin');
const ReportParseErrorPlugin = require('./plugins/ReportParseErrorPlugin');

const TRANSPILED_PACKAGES = [
    // Expo & related modules
    '@expo-google-fonts',
    '@expo/vector-icons',
    '@react-native/assets-registry',
    'expo',
    'expo-asset',
    'expo-auth-session',
    'expo-calendar',
    'expo-constants',
    'expo-file-system',
    'expo-font',
    'expo-image',
    'expo-image-loader',
    'expo-image-picker',
    'expo-location',
    'expo-modules-core',
    'expo-splash-screen',
    'expo-status-bar',
    'expo-video',

    // React Native core
    'react-native',
    'react-native-config',
    'react-native-gesture-handler',
    'react-native-get-random-values',
    'react-native-paper',
    'react-native-reanimated',
    'react-native-safe-area-context',
    'react-native-svg',
    'react-native-svg-transformer',
    'react-native-toast-message',
    'react-native-vector-icons',
    'react-native-webview',
    'react-native-zoom-toolkit',

    // Navigation, lists, and utilities
    '@jsamr/react-native-li',
    '@react-navigation/core',
    '@react-navigation/native',
    '@shopify/flash-list',
    'recyclerlistview',
    'solito',
    'use-latest-callback',

    // Additional packages from dependencies (if needed)
    '@react-native-async-storage/async-storage',
    '@react-native-picker/picker',
    'react-native-draggable-flatlist',
    'react-native-elements',
    'react-native-event-source',
    'react-native-geolocation-service',
    'react-native-gifted-chat',
    'react-native-markdown-display',
    'react-native-screens',
    'react-native-slick',
    'react-native-web',

    // Extra packages (all children not assigned to a section)
    '@babel/plugin-transform-flow-strip-types',
    '@expo/next-adapter',
    '@shared-ui',
    '@types/node',
    '@types/prop-types',
    '@types/react',
    '@types/react-dom',
    'babel-loader',
    'csstype',
    'directory-named-webpack-plugin',
    'file-loader',
    'next',
    'next-transpile-modules',
    'null-loader',
    // 'react',
    // 'react-dom',
    'string-replace-loader',
    'typescript',
    'styled-components/native',
];

const withTM = require('next-transpile-modules')([
    ...TRANSPILED_PACKAGES.filter((name) => name !== '@expo-google-fonts'),
    'expo-modules-core',
    'react-native-web',
    'expo-video',
    'expo',
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        esmExternals: false,
        forceSwcTransforms: true,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    // Rerun the script to regenerate this list from NPM
    // Keep transpilePackages if you need (next-transpile-modules should handle these)
    transpilePackages: TRANSPILED_PACKAGES,

    webpack: (
        config: {
            module: any;
            resolve: {
                fallback: { fs: boolean };
                plugins: any;
                fullySpecified: boolean;
                extensions: string[];
                alias: { [x: string]: any };
            };
            entry: () => Promise<any>;
            plugins: any[];
        },
        { isServer }: any
    ) => {
        const transpilePackagesRegex = new RegExp(
            `[/\\\\]node_modules[/\\\\](${TRANSPILED_PACKAGES?.map((p) => p.replace(/\//g, '[/\\\\]')).join('|')})[/\\\\]`
        );

        const oneOfRule = config.module.rules.find(
            (rule: any) => 'oneOf' in rule
        );
        // https://github.com/vercel/next.js/issues/35110#issuecomment-2286611619
        oneOfRule.oneOf.forEach(
            (rule: { use: (string | string[])[]; exclude: any[] }) => {
                if (
                    'use' in rule &&
                    Array.isArray(rule.use) &&
                    rule.use.some(
                        (u: string | string[]) =>
                            typeof u === 'string' &&
                            (u.includes('react-refresh') ||
                                u.includes('react-refresh-utils'))
                    )
                ) {
                    rule.exclude = [rule.exclude, transpilePackagesRegex];
                }
            }
        );

        config.module.parser = {
            javascript: {
                importMeta: true,
            },
        };

        config.module.rules.push({
            test: /\.js$/,
            parser: {
                javascript: {
                    importMeta: true,
                },
            },
        });

        config.module.rules.push({
            test: /\.[jt]sx?$/,
            resolve: {
                fullySpecified: false,
            },
        });

        config.resolve.fullySpecified = false;
        config.resolve.extensions.push('.mjs', '.ts', '.tsx');
        config.resolve.plugins = config.resolve.plugins || [];
        config.resolve.plugins.push(new DirectoryNamedWebpackPlugin());
        // config.plugins.push(new ReportParseErrorPlugin());

        // Insert polyfills in entry
        const originalEntry = config.entry;
        config.entry = async () => {
            const entries = await originalEntry();
            Object.keys(entries).forEach((key) => {
                if (
                    Array.isArray(entries[key]) &&
                    !entries[key].includes(polyfillPath)
                ) {
                    entries[key].unshift(polyfillPath);
                }
            });
            return entries;
        };

        config.resolve.alias['react-native-web/dist/exports/UIManager'] =
            path.resolve(__dirname, 'stubs/UIManager.js');

        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.EXPO_OS': JSON.stringify('web'),
            })
        );

        const secureStoreStub = path.resolve(
            __dirname,
            './stubs/expo-secure-store.js'
        );
        config.resolve.alias['expo-secure-store'] = secureStoreStub;

        config.plugins.push(
            new webpack.NormalModuleReplacementPlugin(
                /expo-secure-store[\\\/]build[\\\/]ExpoSecureStore$/,
                (resource: { request: any }) => {
                    // Force the request to our stub file
                    resource.request = secureStoreStub;
                }
            )
        );

        config.resolve.alias['expo-image'] = path.resolve(
            __dirname,
            './stubs/expo-image.js'
        );

        config.module.rules.push({
            test: /\.ttf$/,
            type: 'asset/resource',
            generator: {
                filename: 'static/fonts/[name].[hash][ext]',
            },
        });

        // **DEBUGGING RULE FOR POLYFILLS:** Process .ts files in polyfills folder with Babel
        config.module.rules.push({
            test: /\.ts$/,
            include: [path.resolve(__dirname, 'polyfills')],
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [require.resolve('@babel/preset-typescript')],
                    plugins: [
                        [
                            '@babel/plugin-transform-class-properties',
                            { loose: true },
                        ],
                        [
                            '@babel/plugin-transform-private-methods',
                            { loose: true },
                        ],
                        [
                            '@babel/plugin-transform-private-property-in-object',
                            { loose: true },
                        ],
                    ],
                },
            },
        });

        config.module.rules.push({
            test: /\.[jt]sx?$/,
            include: /node_modules[\\\/]@react-native[\\\/]assets-registry/,
            use: {
                loader: 'babel-loader',
                options: {
                    // Use expo's Babel preset, which supports Flow stripping.
                    presets: [require.resolve('babel-preset-expo')],
                    plugins: [
                        [
                            '@babel/plugin-transform-class-properties',
                            { loose: true },
                        ],
                        [
                            '@babel/plugin-transform-private-methods',
                            { loose: true },
                        ],
                        [
                            '@babel/plugin-transform-private-property-in-object',
                            { loose: true },
                        ],
                    ],
                },
            },
        });

        config.module.rules.push({
            test: /[\\\/]use-latest-callback[\\\/]lib[\\\/]src[\\\/].*\.js$/,
            enforce: 'pre',
            type: 'javascript/auto',
            use: [
                {
                    loader: 'string-replace-loader',
                    options: {
                        search: /import\.meta\.webpackHot\.accept\(\);?/g,
                        replace: '',
                        flags: 'g',
                    },
                },
            ],
        });

        config.module.rules.push({
            test: /\.[jt]sx?$/,
            include: /node_modules[\\\/]expo-modules-core/,
            enforce: 'pre',
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [require.resolve('babel-preset-expo')],
                    plugins: [
                        [
                            '@babel/plugin-transform-class-properties',
                            { loose: true },
                        ],
                        [
                            '@babel/plugin-transform-private-methods',
                            { loose: true },
                        ],
                        [
                            '@babel/plugin-transform-private-property-in-object',
                            { loose: true },
                        ],
                    ],
                },
            },
        });

        config.module.rules.push({
            test: /expo-modules-core[\\\/].*\.(js|ts)x?$/,
            enforce: 'pre',
            loader: 'string-replace-loader',
            options: {
                // Replace any occurrence of the directory import with the fully-specified file
                search: /react-native-web\/dist\/exports\/UIManager(\/)?/g,
                replace: 'react-native-web/dist/exports/UIManager/index.js',
                flags: 'g',
            },
        });

        config.module.rules.push({
            test: /assertThisInitialized\.js$/,
            include:
                /next[\\\/]dist[\\\/]compiled[\\\/]@babel[\\\/]runtime[\\\/]helpers/,
            use: {
                loader: 'babel-loader',
                options: {
                    // You can add any presets you normally use; at minimum, use env.
                    presets: [require.resolve('@babel/preset-env')],
                    plugins: [
                        // This plugin will transform ES modules to CommonJS, removing import.meta
                        ['@babel/plugin-transform-modules-commonjs', {}],
                        [
                            '@babel/plugin-transform-class-properties',
                            { loose: true },
                        ],
                        [
                            '@babel/plugin-transform-private-methods',
                            { loose: true },
                        ],
                        [
                            '@babel/plugin-transform-private-property-in-object',
                            { loose: true },
                        ],
                    ],
                    sourceType: 'unambiguous',
                },
            },
        });

        // https://github.com/vercel/next.js/pull/60515
        config.module.rules.push({
            test: /\.js$/,
            // Optionally narrow the scope by including the directory that contains the problematic file.
            include: /@babel[\\\/]runtime[\\\/]helpers/,
            enforce: 'pre',
            use: [
                {
                    loader: 'string-replace-loader',
                    options: {
                        search: /import\.meta\.webpackHot/g,
                        replace: '__webpack_module__.hot',
                        flags: 'g',
                    },
                },
            ],
        });

        // https://github.com/expo/vector-icons/issues/226#issuecomment-1836167513
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            'react-native$': 'react-native-web',
            '@expo/vector-icons': 'react-native-vector-icons',
        };

        // config.resolve.alias['react'] = require.resolve('react');
        // config.resolve.alias['react-dom'] = require.resolve('react-dom');

        // client side stuff
        if (!isServer) {
            // on the client side, "fs" should be treated as unavailable.
            config.resolve.fallback = {
                fs: false,
            };
        }

        // For server builds, alias the browser environment file to our stub
        if (isServer) {
            // config.plugins.push(new ReplaceUseLayoutEffectPlugin());

            config.resolve.alias[
                'expo-modules-core/src/environment/browser.web'
            ] = path.resolve(
                __dirname,
                'stubs/expo-modules-core_browser.web.js'
            );

            config.resolve.alias['react-native-reanimated'] = require.resolve(
                './stubs/react-native-reanimated.js'
            );

            config.resolve.alias[
                'expo-image-picker/build/ExponentImagePicker'
            ] = path.resolve(__dirname, 'stubs/ExponentImagePicker.js');
        }

        // You can remove custom rules for expo-modules-core if next-transpile-modules handles it.
        return config;
    },
};

module.exports = withTM(withExpo(nextConfig));
