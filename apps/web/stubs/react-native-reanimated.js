// react-native-reanimated.js
// This is a stub for react-native-reanimated for environments (like SSR)
// where native modules and animations are not available.
// All implementations here are no-ops or simplified versions to mimic the API.

export const VERSION = 'stub';

// Creates an animated component that simply returns the original component.
export function createAnimatedComponent(Component) {
    return Component;
}

// A hook that returns an empty style object.
export function useAnimatedStyle(callback, deps) {
    return {};
}

// A hook that returns a shared value object with getter and setter.
export function useSharedValue(initialValue) {
    return {
        value: initialValue,
        get() {
            return this.value;
        },
        set(newValue) {
            this.value = newValue;
        },
    };
}

// A hook for handling gestures, returns a no-op handler.
export function useAnimatedGestureHandler(handlers) {
    return () => {};
}

// Animation functions that immediately return the provided value.
export function withTiming(value, config, callback) {
    if (callback) {
        callback(true);
    }
    return value;
}

export function withSpring(value, config, callback) {
    if (callback) {
        callback(true);
    }
    return value;
}

// A basic easing object with simple functions.
export const Easing = {
    linear: (t) => t,
    ease: (t) => t,
    // Stub implementation of bezier easing.
    // Returns a function that simply returns the input value.
    bezier: (x1, y1, x2, y2) => (t) => t,
    // Extend with additional easing functions if needed.
};

// Runs a function on the JavaScript thread.
export function runOnJS(fn) {
    return fn;
}

// Runs a function on the UI thread; here just returns the function.
export function runOnUI(fn) {
    return fn;
}

// A simple linear interpolation function.
export function interpolate(
    input,
    inputRange,
    outputRange,
    extrapolate = 'clamp'
) {
    if (inputRange.length < 2 || outputRange.length < 2) {
        throw new Error(
            'interpolate requires at least two elements in each range'
        );
    }
    // For a stub, perform a basic linear interpolation between the first two points.
    const [inputMin, inputMax] = inputRange;
    const [outputMin, outputMax] = outputRange;
    const progress = (input - inputMin) / (inputMax - inputMin);
    return outputMin + progress * (outputMax - outputMin);
}

// A stub for useAnimatedRef hook.
export function useAnimatedRef() {
    return { current: null };
}

// Additional exports that might be used internally by react-native-reanimated:

// Stub for measuring layouts.
export function measure() {
    return { x: 0, y: 0, width: 0, height: 0 };
}

// Export a default object to support default imports as well.
export default {
    VERSION,
    createAnimatedComponent,
    useAnimatedStyle,
    useSharedValue,
    useAnimatedGestureHandler,
    withTiming,
    withSpring,
    Easing,
    runOnJS,
    runOnUI,
    interpolate,
    useAnimatedRef,
    measure,
};
