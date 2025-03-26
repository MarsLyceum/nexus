module.exports = {
    plugins: [
        '@typescript-eslint',
        'eslint-comments',
        'jest',
        'promise',
        'unicorn',
        'react',
        'react-hooks',
    ],
    extends: [
        'eslint:recommended',
        'next/core-web-vitals',
        'next/typescript',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended-legacy',
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:eslint-comments/recommended',
        'plugin:jest/recommended',
        'plugin:promise/recommended',
        'plugin:unicorn/recommended',
        'prettier',
    ],
    env: {
        node: true,
        browser: true,
        jest: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: [
            './tsconfig.json',
            './apps/mobile/tsconfig.json',
            './apps/web/tsconfig.json',
            './packages/shared-ui/tsconfig.json',
        ],
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        'unicorn/no-useless-undefined': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        'max-lines': [
            'error',
            { max: 500, skipBlankLines: true, skipComments: true },
        ],
        'no-plusplus': 'off',
        'no-void': 'off',
        'unicorn/prefer-top-level-await': 'off',
        'react/prop-types': 'off',
        'import/extensions': 'off',
        'react/jsx-boolean-value': 'error',
        'unicorn/filename-case': 'off',
        '@typescript-eslint/no-misused-promises': 'warn',
        'react/no-unescaped-entities': 'off',
        'unicorn/no-negated-condition': 'off',
        'no-restricted-syntax': 'off',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        // Too restrictive, writing ugly code to defend against a very unlikely scenario: https://eslint.org/docs/rules/no-prototype-builtins
        'no-prototype-builtins': 'off',
        // https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
        'import/prefer-default-export': 'off',
        'import/no-default-export': 'error',
        // Too restrictive: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/destructuring-assignment.md
        'react/destructuring-assignment': 'off',
        // No jsx extension: https://github.com/facebook/create-react-app/issues/87#issuecomment-234627904
        'react/jsx-filename-extension': 'off',
        // Use function hoisting to improve code readability
        // Allow most functions to rely on type inference. If the function is exported, then `@typescript-eslint/explicit-module-boundary-types` will ensure it's typed.
        '@typescript-eslint/explicit-function-return-type': 'off',
        // Common abbreviations are known and readable
        'unicorn/prevent-abbreviations': 'off',
        // Airbnb prefers forEach
        'unicorn/no-array-for-each': 'off',
        // It's not accurate in the monorepo style
        'import/no-extraneous-dependencies': 'off',
    },
    overrides: [
        {
            files: ['*.js'],
            rules: {
                // Allow CJS until ESM support improves
                '@typescript-eslint/no-var-requires': 'off',
                'unicorn/prefer-module': 'off',
            },
        },
    ],
    ignorePatterns: [
        'node_modules/',
        'dist/',
        'build/',
        '*.min.js',
        '*.test.js',
        '*.config.js',
        'index.js',
        'electron-shell/main.js',
        'declarations.d.ts',
        'babel.config.js',
        '.eslintrc.js',
    ],
};
