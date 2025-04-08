// apps/web/.eslintrc.js
module.exports = {
    // If you had any configuration here, it would be merged
    extends: [
        '../../.eslintrc.base.js', // path adjusted relative to your web project
        'plugin:next/recommended',
        'next/core-web-vitals',
        'next/typescript',
    ],
    // You can add web-specific rules and settings below:
    rules: {
        // Example: disable a rule that Next.js needs off
        'react/react-in-jsx-scope': 'off',
    },
    env: {
        browser: true,
        node: false,
    },
};
