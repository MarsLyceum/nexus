const dotenv = require('dotenv');

dotenv.config({ path: '../../.env.local' });

module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'babel-plugin-transform-inline-environment-variables',
                { include: ['USE_REMOTE_GRAPHQL'] },
            ],

            ['@babel/plugin-transform-class-properties', { loose: true }],
            ['@babel/plugin-transform-private-methods', { loose: true }],

            // ...other plugins if any
            'react-native-reanimated/plugin', // IMPORTANT: must be last!
        ],
    };
};
