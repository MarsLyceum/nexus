const { mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

const config = {
    resolver: {
        unstable_enableSymlinks: true,
        unstable_enablePackageExports: true,
        extraNodeModules: {
            http: require.resolve('react-native-http'),
            https: require.resolve('react-native-https'),
            zlib: require.resolve('pako'),
            util: require.resolve('util'),
            stream: require.resolve('stream-browserify'),
            crypto: require.resolve('crypto-browserify'),
            url: require.resolve('url'),
            events: require.resolve('events'),
            assert: require.resolve('assert'),
        },
    },
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: true,
                inlineRequires: true,
            },
        }),
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
