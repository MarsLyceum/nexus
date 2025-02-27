import { getStateFromPath as defaultGetStateFromPath } from '@react-navigation/native';

export const linking = {
    prefixes: ['peeps://', 'http://localhost:8081'],
    config: {
        screens: {
            Main: {
                screens: {
                    PostScreen: 'post/:id', // the base path for PostScreen
                },
            },
        },
    },
    getPathFromState(state, options) {
        // We use findLatestRoute to build the URL (see next section for that function).
        const route = findLatestRoute(state, 'PostScreen');
        if (route && route.params) {
            const { id, parentCommentId } = route.params;
            if (id) {
                // The linking config already supplies "post/", so we return the extra segments.
                if (parentCommentId && parentCommentId.trim() !== '') {
                    return `${id}/comment/${parentCommentId}`;
                }
                return `${id}`;
            }
        }
        return '';
    },
    getStateFromPath(path, options) {
        // Handle URL with comment thread
        const commentMatch = path.match(/^\/?post\/([^/]+)\/comment\/(.+)$/);
        if (commentMatch) {
            const [, id, parentCommentId] = commentMatch;
            const state = {
                routes: [
                    {
                        name: 'Main',
                        state: {
                            routes: [
                                {
                                    name: 'PostScreen',
                                    params: { id, parentCommentId },
                                },
                            ],
                        },
                    },
                ],
            };
            return state;
        }
        // Handle URL without comment thread
        const postMatch = path.match(/^\/?post\/([^/]+)$/);
        if (postMatch) {
            const [, id] = postMatch;
            const state = {
                routes: [
                    {
                        name: 'Main',
                        state: {
                            routes: [
                                {
                                    name: 'PostScreen',
                                    params: { id },
                                },
                            ],
                        },
                    },
                ],
            };
            return state;
        }
        return defaultGetStateFromPath(path, options);
    },
};

// Helper: recursively find the deepest route matching the given name.
function findLatestRoute(state, routeName) {
    let latestRoute = null;
    function traverse(s) {
        if (!s) return;
        if (s.name === routeName) {
            latestRoute = s;
        }
        if (s.routes && s.routes.length > 0) {
            s.routes.forEach((r) => {
                traverse(r.state || r);
            });
        }
    }
    traverse(state);
    return latestRoute;
}
