module.exports = function babel(api) {
    api.cache(true);
    return {
        presets: [
            'babel-preset-expo',
            'module:metro-react-native-babel-preset',
            '@babel/preset-env',
            '@babel/preset-typescript',
        ],
        plugins: [
            ['@babel/plugin-transform-class-properties', { loose: true }],
            ['@babel/plugin-transform-private-methods', { loose: true }],
            [
                '@babel/plugin-transform-private-property-in-object',
                { loose: true },
            ],
        ],
    };
};
