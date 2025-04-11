module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ['inline-dotenv', { path: '../../.env.local' }],
            // ...other plugins if any
            'react-native-reanimated/plugin', // IMPORTANT: must be last!
        ],
    };
};
