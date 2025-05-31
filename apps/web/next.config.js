const path = require('path');
const webpack = require('webpack');
// const DirectoryNamedWebpackPlugin = require('directory-named-webpack-plugin');

const ReplaceUseLayoutEffectPlugin = require('./plugins/ReplaceUseLayoutEffectPlugin');
const ReportParseErrorPlugin = require('./plugins/ReportParseErrorPlugin');
const ServerSourceMapPlugin = require('./plugins/ServerSourceMapPlugin');

const { withExpo } = require('./expo-next-adapter.cjs');

const TRANSPILED_PACKAGES = [
    // Expo & related modules
    '@expo-google-fonts',
    // '@react-native/assets-registry',
    'expo',
    // 'expo-asset',
    'expo-auth-session',
    'expo-calendar',
    'expo-constants',
    'expo-file-system',
    // 'expo-font',
    'expo-image',
    // 'expo-image-loader',
    'expo-image-picker',
    'expo-location',
    'expo-modules-core',
    'expo-splash-screen',
    'expo-status-bar',
    'expo-video',

    // React Native core
    'react-native',
    'react-native-config',
    // 'react-native-gesture-handler',
    'react-native-get-random-values',
    // 'react-native-paper',
    'react-native-reanimated',
    'react-native-safe-area-context',
    'react-native-svg',
    'react-native-svg-transformer',
    'react-native-toast-message',
    'react-native-vector-icons',
    'react-native-webview',
    'react-native-zoom-toolkit',

    // Navigation, lists, and utilities
    // '@jsamr/react-native-li',
    '@react-navigation/core',
    '@react-navigation/native',
    '@shopify/flash-list',
    // 'recyclerlistview',
    'solito',
    // 'use-latest-callback',

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
    // '@babel/plugin-transform-flow-strip-types',
    // '@expo/next-adapter',
    'shared-ui',
    // '@types/node',
    // '@types/prop-types',
    // '@types/react',
    // '@types/react-dom',
    // 'babel-loader',
    // 'csstype',
    // 'directory-named-webpack-plugin',
    // 'file-loader',
    // 'next',
    // 'next-transpile-modules',
    // 'null-loader',
    // 'react',
    // 'react-dom',
    // 'string-replace-loader',
    // 'typescript',
    // 'styled-components/native',
    'formik',
    'react-virtualized',
    '@shopify/react-native-skia',
    '@react-native/assets-registry',
    'gifuct-js',
    '@react-native-community/slider',
    'react-native-extra-dimensions-android',
    'expo-screen-orientation',
    'react-native-video',
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

    env: {
        NEXT_PUBLIC_USE_REMOTE_GRAPHQL: String(
            process.env.USE_REMOTE_GRAPHQL === 'true'
        ),
    },

    // async rewrites() {
    //     const LOCAL = 'http://localhost:4000';
    //     const REMOTE =
    //         'https://nexus-web-service-197277044151.us-west1.run.app';

    //     // if in production *or* you explicitly requested remote, use REMOTE
    //     const forceRemote =
    //         (process.env.NODE_ENV === 'production' &&
    //             !(process.env.LOCAL_BUILD === 'true')) ||
    //         process.env.USE_REMOTE_GRAPHQL === 'true';

    //     const target = forceRemote ? REMOTE : LOCAL;

    //     return [
    //         {
    //             source: '/graphql/:path*',
    //             destination: `${target}/graphql/:path*`,
    //         },
    //     ];
    // },
    experimental: {
        esmExternals: true,
        forceSwcTransforms: true,
        serverSourceMaps: true,
        serverMinification: false,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'https',
                hostname: 'media.giphy.com',
            },
            {
                protocol: 'https',
                hostname: 'media0.giphy.com',
            },
            {
                protocol: 'https',
                hostname: 'media1.giphy.com',
            },
            {
                protocol: 'https',
                hostname: 'media2.giphy.com',
            },
            {
                protocol: 'https',
                hostname: 'media3.giphy.com',
            },
            {
                protocol: 'https',
                hostname: 'media4.giphy.com',
            },
        ],
    },
    devIndicators: false,
    // Rerun the script to regenerate this list from NPM
    // Keep transpilePackages if you need (next-transpile-modules should handle these)
    transpilePackages: TRANSPILED_PACKAGES,
    productionBrowserSourceMaps: true,

    webpack: (
        config,

        { isServer, dev }
    ) => {
        // if (!dev && isServer) {
        //     config.devtool = 'inline-source-map';
        // }

        // if (isServer) {
        //     // disable the built-in devtool so our plugin takes over
        //     config.devtool = false;

        //     // use the source‐map plugin rather than devtool, so nothing gets clobbered
        //     config.plugins.push(
        //         new webpack.SourceMapDevToolPlugin({
        //             filename: '[file].map',
        //             test: /\.(js|cjs|mjs)$/, // match all server chunk types
        //         })
        //     );
        // }

        if (isServer) {
            // ensure devtool generates maps
            config.devtool = 'source-map';
            // config.devtool = false;

            config.optimization.minimize = false;
            config.optimization.minimizer = [];

            // config.module.rules.unshift({
            //     test: /\.[jt]sx?$/,
            //     enforce: 'pre',
            //     use: [
            //         {
            //             loader: path.resolve(
            //                 __dirname,
            //                 'plugins/swc-sourcemap-loader.js'
            //             ),
            //         },
            //     ],
            // });

            config.module.rules.push({
                test: /\.[jt]sx?$/,
                enforce: 'post', // <<— important
                exclude: /node_modules/,
                use: require.resolve('./plugins/swc-sourcemap-loader.js'),
            });

            config.output = {
                ...config.output,
                sourceMapFilename: '[name].js.map',
            };

            // plug in our generator
            config.plugins.push(
                new ServerSourceMapPlugin({ filename: '[name].js.map' })
            );
        }

        // config.devtool = 'eval-source-map';

        const transpilePackagesRegex = new RegExp(
            `[/\\\\]node_modules[/\\\\](${TRANSPILED_PACKAGES?.map((p) => p.replace(/\//g, '[/\\\\]')).join('|')})[/\\\\]`
        );

        const oneOfRule = config.module.rules.find((rule) => 'oneOf' in rule);
        // https://github.com/vercel/next.js/issues/35110#issuecomment-2286611619
        oneOfRule.oneOf.forEach((rule) => {
            if (
                'use' in rule &&
                Array.isArray(rule.use) &&
                rule.use.some(
                    (u) =>
                        typeof u === 'string' &&
                        (u.includes('react-refresh') ||
                            u.includes('react-refresh-utils'))
                )
            ) {
                rule.exclude = [rule.exclude, transpilePackagesRegex];
            }
        });

        config.module.parser = {
            javascript: {
                importMeta: true,
            },
        };

        config.resolve.mainFields = ['module', 'main'];

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
        // config.resolve.plugins.push(new DirectoryNamedWebpackPlugin());
        // config.plugins.push(new ReportParseErrorPlugin());

        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.EXPO_OS': JSON.stringify('web'),
            })
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

        // force @react-native/assets-registry through Babel so its `import type` lines get stripped
        config.module.rules.unshift({
            test: /\.js$/,
            include: /node_modules[\\\/]@react-native[\\\/]assets-registry/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        require.resolve('next/babel'),
                        require.resolve('@babel/preset-typescript'),
                    ],
                    plugins: [
                        require.resolve(
                            '@babel/plugin-transform-flow-strip-types'
                        ),
                    ],
                    cacheDirectory: true,
                    babelrc: false,
                    configFile: false,
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
            'react-native/Libraries/Image/AssetRegistry': path.resolve(
                __dirname,
                'stubs/AssetRegistryStub.js'
            ),
            '@react-native/assets-registry/registry': path.resolve(
                __dirname,
                'stubs/RegistryStub.js'
            ),
        };

        config.resolve.modules = [
            path.resolve(__dirname, 'node_modules'),
            'node_modules',
        ];

        // client side stuff
        if (!isServer) {
            // on the client side, "fs" should be treated as unavailable.
            config.resolve.fallback = {
                fs: false,
            };
        }

        // For server builds, alias the browser environment file to our stub
        if (isServer) {
            config.plugins.push(new ReplaceUseLayoutEffectPlugin());

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

            config.resolve.alias['expo-image'] = path.resolve(
                __dirname,
                './stubs/expo-image.js'
            );
        }

        return config;
    },
};

module.exports = withTM(withExpo(nextConfig));
