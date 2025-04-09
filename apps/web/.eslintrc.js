// apps/web/.eslintrc.js
module.exports = {
    // If you had any configuration here, it would be merged
    extends: [
        '../../.eslintrc.js', // path adjusted relative to your web project
        'next/core-web-vitals',
        'next/typescript',
    ],
    // You can add web-specific rules and settings below:
    rules: {
        // Example: disable a rule that Next.js needs off
        'react/react-in-jsx-scope': 'off',
        'import/no-default-export': 'off',
    },
    env: {
        browser: true,
        node: false,
    },
};
