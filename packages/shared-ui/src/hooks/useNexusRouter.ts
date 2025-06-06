// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable react-hooks/rules-of-hooks */
import {
    redirect,
    useRouter as useNextRouter,
    usePathname,
    useSearchParams,
} from 'next/navigation';
import {
    useNavigation,
    CommonActions,
    NavigationState,
} from '@react-navigation/native';
import { Platform } from 'react-native';
import { detectEnvironment, Environment } from '../utils';

// Define the type for our custom router API using types (not interfaces)
export type NexusRouter = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    push: (path: string, params?: Record<string, any>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replace: (path: string, params?: Record<string, any>) => void;
    goBack: () => void;
    getCurrentRoute: () => string;
    isFocused: (path: string) => boolean;
};

// Helper to build a URL with query parameters for Next.js.
function buildUrlWithParams(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>
): string {
    if (params && Object.keys(params).length > 0) {
        // Check if the path already contains a query string.
        const separator = path.includes('?') ? '&' : '?';
        const queryString = new URLSearchParams(params).toString();
        return `${path}${separator}${queryString}`;
    }
    return path;
}

/**
 * useNexusRouter
 *
 * A custom hook that abstracts navigation logic across Next.js and React Native,
 * supporting both query params (for Next) and navigation params (for React Native)
 * in a unified API.
 */
export function useNexusRouter(): NexusRouter {
    const environment: Environment = detectEnvironment();

    if (environment === 'nextjs-server') {
        // Server-side: use redirect for both push and replace.
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            push: (path: string, params?: Record<string, any>) => {
                redirect(buildUrlWithParams(path, params));
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            replace: (path: string, params?: Record<string, any>) => {
                redirect(buildUrlWithParams(path, params));
            },
            goBack: () => {
                throw new Error('goBack is not supported on the server side.');
            },
            getCurrentRoute: () => {
                throw new Error(
                    'getCurrentRoute is not supported on the server side.'
                );
            },
            isFocused: () => true,
        };
    }

    if (environment === 'nextjs-client') {
        const router = useNextRouter();
        const pathname = usePathname();
        const searchParams = useSearchParams();

        // rebuild the full URL
        const asPath =
            searchParams.toString().length > 0
                ? `${pathname}?${searchParams.toString()}`
                : pathname;

        const getCurrentRoute = () => asPath;

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            push: (path: string, params?: Record<string, any>) => {
                router.push(buildUrlWithParams(path, params));
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            replace: (path: string, params?: Record<string, any>) => {
                router.replace(buildUrlWithParams(path, params));
            },
            goBack: () => {
                // If browser history length is greater than one, go back; otherwise, go to home.
                if (
                    typeof globalThis !== 'undefined' &&
                    globalThis.history.length > 1
                ) {
                    router.back();
                } else {
                    router.push('/');
                }
            },
            getCurrentRoute,
            isFocused: (path: string) => getCurrentRoute() === path,
        };
    }

    if (
        environment === 'react-native-web' ||
        environment === 'react-native-mobile'
    ) {
        const navigation = useNavigation();

        // Define default root route for empty navigation.
        const DEFAULT_ROOT_ROUTE = 'dashboard';

        // Helper to normalize path by removing a leading '/' if present.
        // Additionally, if the resulting path is empty, return the default root route.
        const normalizePath = (path: string) => {
            let normalized = path.startsWith('/') ? path.slice(1) : path;
            if (normalized === '') {
                normalized = DEFAULT_ROOT_ROUTE;
            }
            return normalized;
        };

        const findActiveRouteName = (state: NavigationState): string => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const route = state.routes[state.index] as any;
            // if there’s a nested state, dig in
            if (route.state) {
                return findActiveRouteName(route.state as NavigationState);
            }
            return route.name;
        };

        const getCurrentRoute = () => {
            const state = navigation.getState();
            if (state) {
                const name = findActiveRouteName(state);
                return name === DEFAULT_ROOT_ROUTE ? '/' : `/${name}`;
            }

            throw new Error('unknown route');
        };

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            push: (path: string, params?: Record<string, any>) => {
                const normalizedPath = normalizePath(path);
                const state = navigation.getState();
                // Check for a stack navigator by inspecting the state type.
                if (state?.type === 'stack') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (navigation as any).push(normalizedPath, params);
                } else {
                    // @ts-expect-error navigation
                    navigation.navigate(normalizedPath, params);
                }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            replace: (path: string, params?: Record<string, any>) => {
                const normalizedPath = normalizePath(path);
                if (navigation.dispatch) {
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: normalizedPath, params }],
                        })
                    );
                } else {
                    // @ts-expect-error navigation
                    navigation.navigate(normalizedPath, params);
                }

                // If in a browser environment, update the URL via the History API.
                if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
                    // Build full URL from the path and any params.
                    const url = buildUrlWithParams(path, params);

                    try {
                        globalThis.history.replaceState({}, '', url);
                    } catch (error) {
                        console.error(
                            'Error using window.history.replaceState:',
                            error
                        );
                    }
                }
            },
            goBack: () => {
                // If navigation can go back, do so; otherwise, navigate to home.
                if (navigation.canGoBack && navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    // @ts-expect-error navigation
                    navigation.navigate('welcome');
                }
            },
            getCurrentRoute,
            isFocused: (path: string) => getCurrentRoute() === path,
        };
    }

    throw new Error('Unsupported environment for useNexusRouter.');
}
