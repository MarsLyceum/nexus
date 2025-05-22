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
 * - "nextjs-client": when running in a browser with Next.js artifacts present
 * - "react-native-web": when running in a browser using React Native Web without Next.js
 * - "react-native-mobile": when running in a React Native mobile environment
 *
 * Throws an error if the environment cannot be determined.
 */
export function detectEnvironment(): Environment {
    // 1. React Native mobile detection
    if (
        typeof navigator !== 'undefined' &&
        navigator.product === 'ReactNative'
    ) {
        return 'react-native-mobile';
    }

    // 2. Server-side detection
    if (typeof globalThis === 'undefined') {
        if (process.env.NEXT_PHASE || process.env.NEXT_RUNTIME) {
            return 'nextjs-server';
        }
        throw new Error(
            'Unable to detect environment: Unknown server-side context.'
        );
    }

    // 3. Browser/Client-side detection
    if (typeof document !== 'undefined') {
        // Check for Next.js–specific script tags in the DOM
        if (
            document.querySelector('script[src*="/_next/static/"]') ||
            // eslint-disable-next-line no-underscore-dangle
            // @ts-expect-error next variable
            // eslint-disable-next-line no-underscore-dangle, unicorn/no-typeof-undefined
            typeof globalThis.__next_f !== 'undefined'
        ) {
            return 'nextjs-client';
        }
        // If not Next.js, assume React Native Web environment
        return 'react-native-web';
    }

    // Fallback error if environment is undetectable
    throw new Error('Unable to detect environment.');
}
