/* eslint-disable react-hooks/rules-of-hooks */
import { redirect, useRouter as useNextRouter } from 'next/navigation';
import { useNavigation, StackActions } from '@react-navigation/native';
import { detectEnvironment, Environment } from '../utils';

// Define the type for our custom router API using types (not interfaces)
export type NexusRouter = {
    push: (path: string, params?: Record<string, any>) => void;
    replace: (path: string, params?: Record<string, any>) => void;
    goBack: () => void;
};

// Helper to build a URL with query parameters for Next.js.
function buildUrlWithParams(
    path: string,
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
            push: (path: string, params?: Record<string, any>) => {
                redirect(buildUrlWithParams(path, params));
            },
            replace: (path: string, params?: Record<string, any>) => {
                redirect(buildUrlWithParams(path, params));
            },
            goBack: () => {
                throw new Error('goBack is not supported on the server side.');
            },
        };
    }

    if (environment === 'nextjs-client') {
        const router = useNextRouter();
        return {
            push: (path: string, params?: Record<string, any>) => {
                router.push(buildUrlWithParams(path, params));
            },
            replace: (path: string, params?: Record<string, any>) => {
                router.replace(buildUrlWithParams(path, params));
            },
            goBack: () => {
                // If browser history length is greater than one, go back; otherwise, go to home.
                if (
                    typeof window !== 'undefined' &&
                    window.history.length > 1
                ) {
                    router.back();
                } else {
                    router.push('/');
                }
            },
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

        return {
            push: (path: string, params?: Record<string, any>) => {
                const normalizedPath = normalizePath(path);
                if (typeof (navigation as any).push === 'function') {
                    (navigation as any).push(normalizedPath, params);
                } else {
                    // @ts-expect-error navigation
                    navigation.navigate(normalizedPath, params);
                }
            },
            replace: (path: string, params?: Record<string, any>) => {
                const normalizedPath = normalizePath(path);
                if (navigation.dispatch) {
                    navigation.dispatch(
                        StackActions.replace(normalizedPath, params)
                    );
                } else {
                    // @ts-expect-error navigation
                    navigation.navigate(normalizedPath, params);
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
        };
    }

    throw new Error('Unsupported environment for useNexusRouter.');
}
