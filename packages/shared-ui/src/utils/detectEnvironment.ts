// utility.ts

// Define the union type for the environment
export type Environment =
    | 'nextjs-client'
    | 'nextjs-server'
    | 'react-native-web'
    | 'react-native-mobile';

/**
 * detectEnvironment
 *
 * Returns the current environment as one of:
 * - "nextjs-server": when running on a Next.js server (Node.js with Next.js env vars)
 * - "nextjs-client": when running in a browser with Next.js (__NEXT_DATA__ present)
 * - "react-native-web": when running in a browser using React Native Web without Next.js
 * - "react-native-mobile": when running in a React Native mobile environment
 *
 * Throws an error if the environment cannot be determined.
 */
export function detectEnvironment(): Environment {
    // Detect React Native mobile environment
    if (
        typeof navigator !== 'undefined' &&
        navigator.product === 'ReactNative'
    ) {
        return 'react-native-mobile';
    }

    // Check if we're running on the server (Node.js)
    if (typeof window === 'undefined') {
        // If Next.js–specific env variables are present, assume Next.js server
        if (process.env.NEXT_PHASE || process.env.NEXT_RUNTIME) {
            return 'nextjs-server';
        }
        // Otherwise, throw or handle the unknown server environment accordingly
        throw new Error(
            'Unable to detect environment: Unknown server-side context.'
        );
    }

    // At this point, we're in a browser environment (client-side)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // If __NEXT_DATA__ exists, it's a Next.js client environment
        if ((window as any).__NEXT_DATA__) {
            return 'nextjs-client';
        }
        // Otherwise, assume a plain React Native Web environment
        return 'react-native-web';
    }

    // Fallback error if environment is undetectable
    throw new Error('Unable to detect environment.');
}
