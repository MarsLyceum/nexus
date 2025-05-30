// webpack.config.js

const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

/**
 * Custom webpack configuration for Expo.
 * @param {any} env - The environment variables provided by Expo.
 * @param {any} argv - The arguments passed to webpack.
 * @returns {Promise<any>} - A promise that resolves with the webpack configuration.
 */
module.exports = async function (env, argv) {
    // Retrieve the default Expo webpack configuration
    const config = await createExpoWebpackConfigAsync(env, argv);

    if (env.platform === 'web') {
        config.devServer = {
            ...config.devServer,

            // 3) add your proxy rules
            proxy: {
                // any request that starts with /graphql
                '/graphql': {
                    target: 'http://localhost:4000', // your Nexus web service
                    changeOrigin: true, // pretend the host matches
                    secure: false, // skip SSL checks (we're on HTTP)
                },
            },

            // (optional) see logs in your browser console
            client: {
                logging: 'info',
                overlay: false,
            },
        };
    }

    console.log(`Webpack mode: ${argv.mode}`); // Only for debugging during development.

    // Remove the default HtmlWebpackPlugin instance so we can inject our custom template.
    config.plugins = config.plugins.filter(
        (plugin) => !(plugin instanceof HtmlWebpackPlugin)
    );

    // Inject our custom HtmlWebpackPlugin instance with our custom index.html file.
    config.plugins.push(
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'index.html'), // Path to your custom index.html file.
            filename: 'index.html', // Output filename.
            inject: 'body', // Inject assets at the end of the body.
        })
    );

    // Example: Adding a custom alias (production note: adjust paths and remove logging as needed).
    config.resolve.alias = {
        ...config.resolve.alias,
    };

    return config;
};
