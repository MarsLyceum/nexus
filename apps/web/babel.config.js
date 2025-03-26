// babel.config.js
module.exports = function (api) {
    // Detect web usage (for Next.js)
    const isWeb = api.caller(
        (caller) =>
            caller &&
            (caller.name === 'babel-loader' ||
                caller.name === 'next-babel-turbo-loader')
    );

    return {
        presets: [
            isWeb && [require('next/babel'), { runtime: 'automatic' }],
            ,
            ['babel-preset-expo', { jsxRuntime: 'classic' }],
        ].filter(Boolean),
        plugins: [
            // Add the Flow stripping plugin globally so that all Flow syntax is removed.
            '@babel/plugin-transform-flow-strip-types',
            ['@babel/plugin-transform-class-properties', { loose: true }],
            ['@babel/plugin-transform-private-methods', { loose: true }],
            [
                '@babel/plugin-transform-private-property-in-object',
                { loose: true },
            ],
        ],
        sourceType: 'unambiguous',
    };
};
