import {
    getStateFromPath as defaultGetStateFromPath,
    getPathFromState as defaultGetPathFromState,
    PathConfigMap,
    NavigationState,
    PartialState,
} from '@react-navigation/native';

export const linking = {
    prefixes: ['nexus://', 'http://localhost:8081'],
    config: {
        screens: {
            Main: {
                path: '', // omit Main from the URL as well
                screens: {
                    AppDrawer: {
                        path: '', // omit AppDrawer from the URL
                    },
                },
            },
        },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPathFromState(
        state:
            | Readonly<{
                  key: string;
                  index: number;
                  routeNames: string[];
                  history?: unknown[];
                  routes: (Readonly<{
                      key: string;
                      name: string;
                      path?: string;
                  }> &
                      Readonly<{ params?: Readonly<object | undefined> }> & {
                          state?:
                              | NavigationState
                              | PartialState<NavigationState>;
                      })[];
                  type: string;
                  stale: false;
              }>
            | Omit<
                  PartialState<
                      Readonly<{
                          key: string;
                          index: number;
                          routeNames: string[];
                          history?: unknown[];
                          routes: (Readonly<{
                              key: string;
                              name: string;
                              path?: string;
                          }> &
                              Readonly<{
                                  params?: Readonly<object | undefined>;
                              }> & {
                                  state?:
                                      | NavigationState
                                      | PartialState<NavigationState>;
                              })[];
                          type: string;
                          stale: false;
                      }>
                  >,
                  'stale'
              >
    ) {
        const activeRoute = getActiveRoute(state);

        // Only override for PostScreen
        if (activeRoute?.name === 'PostScreen' && activeRoute.params?.id) {
            const { id, parentCommentId } = activeRoute.params;
            // Note: Since your linking config already supplies "post/",
            // we only append the extra segments.
            if (parentCommentId && parentCommentId.trim() !== '') {
                return `post/${id}/comment/${parentCommentId}`;
            }
            return `post/${id}`;
        }

        // For all other routes, delegate to the default logic.
        return defaultGetPathFromState(state, {
            screens: linking.config.screens,
        });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActiveRoute(state: any) {
    let route = state;
    // Traverse into nested states if available.
    while (route) {
        if (
            route.state &&
            route.state.routes &&
            route.state.routes.length > 0
        ) {
            route = route.state.routes[route.state.index || 0];
        } else if (route.routes && route.routes.length > 0) {
            route = route.routes[route.index || 0];
        } else {
            break;
        }
    }
    return route;
}

// Helper: recursively find the deepest route matching the given name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// function findLatestRoute(state: any, routeName: string): any {
//     let latestRoute;
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     function traverse(s: { name: string; routes: any[] }) {
//         if (!s) return;
//         if (s.name === routeName) {
//             latestRoute = s;
//         }
//         if (s.routes && s.routes.length > 0) {
//             s.routes.forEach((r) => {
//                 traverse(r.state || r);
//             });
//         }
//     }
//     traverse(state);
//     return latestRoute;
// }
