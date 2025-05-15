const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const { createProxyMiddleware } = require('http-proxy-middleware');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo.
config.watchFolders = [workspaceRoot];

// Explicitly map the shared-ui package and its subpaths.
config.resolver.extraNodeModules = {
    'shared-ui': path.resolve(workspaceRoot, 'packages/shared-ui/src'),
    'shared-ui/buttons': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/buttons'
    ),
    'shared-ui/cards': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/cards'
    ),
    'shared-ui/constants': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/constants'
    ),
    'shared-ui/hooks': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/hooks'
    ),
    'shared-ui/icons': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/icons'
    ),
    'shared-ui/images': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/images'
    ),
    'shared-ui/providers': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/providers'
    ),
    'shared-ui/queries': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/queries'
    ),
    'shared-ui/redux': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/redux'
    ),
    'shared-ui/sections': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/sections'
    ),
    'shared-ui/small-components': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/small-components'
    ),
    'shared-ui/styles': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/styles'
    ),
    'shared-ui/types': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/types'
    ),
    'shared-ui/utils': path.resolve(
        workspaceRoot,
        'packages/shared-ui/src/utils'
    ),
    'shared-ui/screens': path.resolve(
        workspaceRoot,
        'packages/shared-ui/screens'
    ),
    'shared-ui/theme': path.resolve(workspaceRoot, 'packages/shared-ui/theme'),
};

// Include node_modules from both the mobile app and the workspace root.
config.resolver.nodeModulesPaths = [
    path.join(projectRoot, 'node_modules'),
    path.join(workspaceRoot, 'node_modules'),
];

// Ensure Metro resolves the proper fields for React Native.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

config.resolver.blacklistRE = exclusionList([/apps\/web\/.*/]);

const LOCAL = 'http://localhost:4000';
const REMOTE = 'https://nexus-web-service-197277044151.us-west1.run.app';

// 2️⃣ Decide when to force remote
const forceRemote =
    process.env.NODE_ENV === 'production' ||
    process.env.USE_REMOTE_GRAPHQL === 'true';

// 3️⃣ Pick the target
const GRAPHQL_TARGET = forceRemote ? REMOTE : LOCAL;

config.server = {
    ...config.server,
    enhanceMiddleware: (metroMiddleware, server) => {
        // 3️⃣ Create a proxy for /graphql
        const proxy = createProxyMiddleware({
            context: ['/graphql'], // which paths to proxy
            target: GRAPHQL_TARGET, // your LOCAL or REMOTE
            changeOrigin: true,
            secure: false,
            ws: true, // for WebSocket upgrades
            logLevel: 'debug',
        });

        return (req, res, next) => {
            if (req.url.startsWith('/graphql')) {
                // 4️⃣ Proxy GraphQL requests
                return proxy(req, res, next);
            }
            // 5️⃣ Fall back to Metro’s normal handling
            return metroMiddleware(req, res, next);
        };
    },
};

module.exports = config;
