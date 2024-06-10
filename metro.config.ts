import { getDefaultConfig } from 'expo/metro-config';

const config = getDefaultConfig(__dirname);
if (config?.resolver?.sourceExts)
    config.resolver.sourceExts = [
        ...config.resolver.sourceExts,
        'js',
        'json',
        'ts',
        'tsx',
        'cjs',
    ];

module.exports = config;
