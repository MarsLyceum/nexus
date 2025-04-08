// createNexusParam.tsx
import { useCallback } from 'react';
// Next.js hooks
import { useSearchParams, useRouter as useNextRouter } from 'next/navigation';
// React Navigation hooks (for native)
import { useRoute, useNavigation } from '@react-navigation/native';

import { detectEnvironment, Environment, getSafeWindow } from '../utils';

// Helper to build a URL with query parameters (used in Next.js)
function buildUrlWithParams(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>
): string {
    if (params && Object.keys(params).length > 0) {
        // If the path already contains a query string, append with "&"
        const separator = path.includes('?') ? '&' : '?';
        const queryString = new URLSearchParams(params).toString();
        return `${path}${separator}${queryString}`;
    }
    return path;
}

/**
 * createNexusParam
 *
 * This hook factory returns two hooks:
 * - useParams: lets you read and update multiple parameters at once.
 * - useParam: a convenience hook to work with a single parameter.
 *
 * The implementation detects the environment:
 * - In Next.js client mode, it reads query parameters via next/navigation's useSearchParams
 *   and updates them by merging with the current URL (using useNextRouter.replace).
 * - In React Native (mobile or web), it uses React Navigation’s useRoute (to read params)
 *   and uses setParams (if available) or falls back to a navigation replace via useNavigation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createNexusParam<T extends Record<string, any>>() {
    /**
     * useParams
     *
     * Returns an object containing the current params (of type T) and a setter that
     * merges new parameters with the existing ones.
     */
    function useParams() {
        const environment: Environment = detectEnvironment();

        // We will define variables for reading the current parameters and updating them.
        let currentParams: T;
        let setParams: (newParams: Partial<T>) => void;

        if (environment === 'nextjs-client') {
            // --- NEXT.JS CLIENT ---
            // Read query parameters via useSearchParams.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const searchParams = useSearchParams();
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const nextRouter = useNextRouter();

            // Convert URLSearchParams to a plain object.
            const paramsObj: Record<string, string> = {};
            searchParams.forEach((value, key) => {
                paramsObj[key] = value;
            });
            currentParams = paramsObj as unknown as T;

            // When updating, merge new params with current ones and update the URL.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            setParams = useCallback(
                (newParams: Partial<T>) => {
                    // Merge current and new parameters
                    const mergedParams = { ...paramsObj, ...newParams };
                    // Use the current path as base.
                    const basePath = getSafeWindow()?.location.pathname ?? '';
                    const newUrl = buildUrlWithParams(basePath, mergedParams);
                    // Replace the URL without adding a new history entry.
                    nextRouter.replace(newUrl);
                },
                [nextRouter, paramsObj]
            );
        } else if (
            environment === 'react-native-mobile' ||
            environment === 'react-native-web'
        ) {
            // --- REACT NATIVE ---
            // Read the current parameters using React Navigation's useRoute.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const route = useRoute();
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const navigation = useNavigation();
            currentParams = (route.params || {}) as T;

            // Update parameters by merging with the current ones.
            // Use navigation.setParams if available.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            setParams = useCallback(
                (newParams: Partial<T>) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (typeof (navigation as any).setParams === 'function') {
                        // Merge the new params with the current ones.
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (navigation as any).setParams({
                            ...currentParams,
                            ...newParams,
                        });
                    } else {
                        // Fallback: if setParams is not available, we can navigate (or replace)
                        // using the route's name and new parameters.
                        // (Assumes that the route name is set correctly in your navigator.)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (navigation as any).replace(route.name, {
                            ...currentParams,
                            ...newParams,
                        });
                    }
                },
                [navigation, currentParams, route.name]
            );
        } else {
            // --- FALLBACK (or unsupported environment) ---
            currentParams = {} as T;
            setParams = () => {
                // You might want to throw an error or log a warning here.
                console.warn(
                    'Unsupported environment for parameter management.'
                );
            };
        }

        return { params: currentParams, setParams };
    }

    /**
     * useParam
     *
     * A helper hook to work with a single parameter.
     * Returns a tuple [value, setValue] for the given key.
     */
    function useParam<K extends keyof T>(
        key: K
    ): [T[K] | undefined, (value: T[K]) => void] {
        const { params, setParams } = useParams();
        const value = params[key];
        const setValue = useCallback(
            (newValue: T[K]) => {
                // @ts-expect-error type
                setParams({ [key]: newValue } as Partial<T>);
            },
            [key, setParams]
        );
        return [value, setValue];
    }

    return { useParams, useParam };
}
