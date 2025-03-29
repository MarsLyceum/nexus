// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable react-hooks/rules-of-hooks */
// useNexusRouter.ts

// Next.js imports – both for server-side and client-side.
import { redirect, useRouter as useNextRouter } from 'next/navigation';
// React Navigation imports – used when running in React Native (mobile or web)
import { useNavigation, StackActions } from '@react-navigation/native';

import { detectEnvironment, Environment } from '../utils';

// Define the type for our custom router API using types (not interfaces)
export type NexusRouter = {
    push: (path: string) => void;
    replace: (path: string) => void;
    goBack: () => void;
};

/**
 * useNexusRouter
 *
 * A custom hook that abstracts navigation logic across Next.js and React Native,
 * supporting both server-side and client-side environments.
 *
 * - On the server (Next.js server), it uses Next's server-side redirection via `redirect`.
 * - On the client:
 *    - For Next.js, it uses Next's app router.
 *    - For React Native (mobile and web), it uses React Navigation.
 *
 * Note: The `goBack` method is not supported on the server side.
 *
 * @returns {NexusRouter} An object with navigation methods: push, replace, and goBack.
 */
export function useNexusRouter(): NexusRouter {
    // Client-side: determine the running environment
    const environment: Environment = detectEnvironment();

    if (environment === 'nextjs-server') {
        // On the server (Next.js server), use the redirect function for push/replace.
        return {
            push: (path: string) => {
                redirect(path);
            },
            replace: (path: string) => {
                redirect(path);
            },
            goBack: () => {
                throw new Error('goBack is not supported on the server side.');
            },
        };
    }

    if (environment === 'nextjs-client') {
        const router = useNextRouter();
        return {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            push: router.push,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            replace: router.replace,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            goBack: router.back,
        };
    }

    if (
        environment === 'react-native-web' ||
        environment === 'react-native-mobile'
    ) {
        const navigation = useNavigation();
        return {
            push: (path: string) => {
                // Prefer using push if available to ensure a new route is added to the stack
                if (typeof (navigation as any).push === 'function') {
                    (navigation as any).push(path);
                } else {
                    navigation.navigate(path);
                }
            },
            replace: (path: string) => {
                if (navigation.dispatch) {
                    navigation.dispatch(StackActions.replace(path));
                } else {
                    navigation.navigate(path);
                }
            },
            goBack: () => navigation.goBack(),
        };
    }

    throw new Error('Unsupported environment for useNexusRouter.');
}
