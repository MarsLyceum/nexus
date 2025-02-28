import {
    getStateFromPath as defaultGetStateFromPath,
    PathConfigMap,
} from '@react-navigation/native';

export const linking = {
    prefixes: ['nexus://', 'http://localhost:8081'],
    config: {
        screens: {
            Main: {
                screens: {
                    PostScreen: 'post/:id', // the base path for PostScreen
                },
            },
        },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPathFromState(state: any) {
        // We use findLatestRoute to build the URL (see next section for that function).
        const route = findLatestRoute(state, 'PostScreen');
        //
        if (route?.params) {
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
    getStateFromPath(
        path: string,
        options:
            | { initialRouteName?: string; screens: PathConfigMap<object> }
            | undefined
    ) {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findLatestRoute(state: any, routeName: string): any {
    let latestRoute;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function traverse(s: { name: string; routes: any[] }) {
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
