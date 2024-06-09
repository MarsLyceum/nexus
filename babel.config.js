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
            '@babel/plugin-transform-class-properties',
            '@babel/plugin-transform-private-methods',
            '@babel/plugin-transform-private-property-in-object',
            '@babel/plugin-syntax-dynamic-import',
            '@babel/plugin-proposal-object-rest-spread',
        ],
    };
};
