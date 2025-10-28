export class ReanimatedError extends Error {}

export const Extrapolation: {
    IDENTITY: 'identity';
    CLAMP: 'clamp';
    EXTEND: 'extend';
};

export function interpolate(
    x: number,
    inputRange: number[],
    outputRange: number[],
    type?: string | { extrapolateLeft?: string; extrapolateRight?: string }
): number;

export function clamp(value: number, min: number, max: number): number;

export function createAnimatedComponent<T>(component: T): T;

export function useAnimatedStyle<T>(
    factory: () => T,
    deps?: readonly unknown[]
): T;

export function useSharedValue<T>(initialValue: T): {
    value: T;
};

export function useAnimatedGestureHandler(factory: unknown): () => void;

export function cancelAnimation(): void;

export function withTiming<T>(
    value: T,
    config?: unknown,
    callback?: () => void
): T;

export function withSpring<T>(
    value: T,
    config?: unknown,
    callback?: () => void
): T;

export function withDecay<T>(
    value: T,
    config?: unknown,
    callback?: () => void
): T;

export const Easing: {
    linear: (t: number) => number;
    ease: (t: number) => number;
    bezier: (
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ) => (t: number) => number;
};

export function runOnJS<T extends (...args: any[]) => any>(fn: T): T;

export function runOnUI<T extends (...args: any[]) => any>(fn: T): T;

export function useAnimatedRef<T>(): { current: T | null };

export function useAnimatedProps<T>(
    factory: () => T,
    deps?: readonly unknown[]
): T;

export function measure(node?: unknown): {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function useAnimatedScrollHandler(handler: unknown): () => void;

export function useDerivedValue<T>(
    updater: () => T,
    deps?: readonly unknown[]
): {
    value: T;
};

export function useAnimatedReaction<T, U>(
    prepare: () => T,
    react: (input: T, previous: U | null) => void,
    deps?: readonly unknown[]
): void;

const reanimated: {
    VERSION: string;
    createAnimatedComponent: typeof createAnimatedComponent;
    useAnimatedStyle: typeof useAnimatedStyle;
    useSharedValue: typeof useSharedValue;
    useAnimatedGestureHandler: typeof useAnimatedGestureHandler;
    cancelAnimation: typeof cancelAnimation;
    withTiming: typeof withTiming;
    withSpring: typeof withSpring;
    withDecay: typeof withDecay;
    Easing: typeof Easing;
    runOnJS: typeof runOnJS;
    runOnUI: typeof runOnUI;
    interpolate: typeof interpolate;
    clamp: typeof clamp;
    useAnimatedRef: typeof useAnimatedRef;
    useAnimatedProps: typeof useAnimatedProps;
    measure: typeof measure;
    useDerivedValue: typeof useDerivedValue;
    useAnimatedReaction: typeof useAnimatedReaction;
    useAnimatedScrollHandler: typeof useAnimatedScrollHandler;
};

export default reanimated;
