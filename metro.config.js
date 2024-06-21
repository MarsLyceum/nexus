const { mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

const config = {
    resolver: {
        unstable_enableSymlinks: true,
        unstable_enablePackageExports: true,
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
