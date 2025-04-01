'use strict';

// This is a stub for react-native-reanimated for environments (like SSR)
// where native modules and animations are not available.
// All implementations here are no-ops or simplified versions to mimic the API.

//
// --- Helper Types and Functions from react-native-reanimated ---
//

/** Stub error class for reanimated errors. */
export class ReanimatedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ReanimatedError';
    }
}

/**
 * Extrapolation type.
 *
 * - IDENTITY: Returns the provided value as is.
 * - CLAMP: Clamps the value to the edge of the output range.
 * - EXTEND: Predicts the values beyond the output range.
 */
export const Extrapolation = {
    IDENTITY: 'identity',
    CLAMP: 'clamp',
    EXTEND: 'extend',
};

/**
 * Helper that returns the appropriate value based on the extrapolation type.
 */
function getVal(type, coef, val, leftEdgeOutput, rightEdgeOutput, x) {
    'worklet';
    switch (type) {
        case Extrapolation.IDENTITY:
            return x;
        case Extrapolation.CLAMP:
            if (coef * val < coef * leftEdgeOutput) {
                return leftEdgeOutput;
            }
            return rightEdgeOutput;
        case Extrapolation.EXTEND:
        default:
            return val;
    }
}

/**
 * Checks if the given string is a valid extrapolation type.
 */
function isExtrapolate(value) {
    'worklet';
    return (
        value === Extrapolation.EXTEND ||
        value === Extrapolation.CLAMP ||
        value === Extrapolation.IDENTITY
    );
}

/**
 * Validates and converts the provided extrapolation type into a configuration object.
 */
function validateType(type) {
    'worklet';
    const extrapolationConfig = {
        extrapolateLeft: Extrapolation.EXTEND,
        extrapolateRight: Extrapolation.EXTEND,
    };

    if (!type) {
        return extrapolationConfig;
    }

    if (typeof type === 'string') {
        if (!isExtrapolate(type)) {
            throw new ReanimatedError(
                `Unsupported value for "interpolate" 
Supported values: ["extend", "clamp", "identity", Extrapolation.CLAMP, Extrapolation.EXTEND, Extrapolation.IDENTITY]
Valid example:
  interpolate(value, [inputRange], [outputRange], "clamp")`
            );
        }
        extrapolationConfig.extrapolateLeft = type;
        extrapolationConfig.extrapolateRight = type;
        return extrapolationConfig;
    }

    if (
        (type.extrapolateLeft && !isExtrapolate(type.extrapolateLeft)) ||
        (type.extrapolateRight && !isExtrapolate(type.extrapolateRight))
    ) {
        throw new ReanimatedError(
            `Unsupported value for "interpolate" 
Supported values: ["extend", "clamp", "identity", Extrapolation.CLAMP, Extrapolation.EXTEND, Extrapolation.IDENTITY]
Valid example:
  interpolate(value, [inputRange], [outputRange], {
    extrapolateLeft: Extrapolation.CLAMP,
    extrapolateRight: Extrapolation.IDENTITY
  })`
        );
    }

    return {
        extrapolateLeft: type.extrapolateLeft
            ? type.extrapolateLeft
            : Extrapolation.EXTEND,
        extrapolateRight: type.extrapolateRight
            ? type.extrapolateRight
            : Extrapolation.EXTEND,
    };
}

/**
 * Internal interpolation helper that applies extrapolation when needed.
 */
function internalInterpolate(x, narrowedInput, extrapolationConfig) {
    'worklet';
    const { leftEdgeInput, rightEdgeInput, leftEdgeOutput, rightEdgeOutput } =
        narrowedInput;
    if (rightEdgeInput - leftEdgeInput === 0) {
        return leftEdgeOutput;
    }
    const progress = (x - leftEdgeInput) / (rightEdgeInput - leftEdgeInput);
    const val = leftEdgeOutput + progress * (rightEdgeOutput - leftEdgeOutput);
    const coef = rightEdgeOutput >= leftEdgeOutput ? 1 : -1;

    if (coef * val < coef * leftEdgeOutput) {
        return getVal(
            extrapolationConfig.extrapolateLeft,
            coef,
            val,
            leftEdgeOutput,
            rightEdgeOutput,
            x
        );
    } else if (coef * val > coef * rightEdgeOutput) {
        return getVal(
            extrapolationConfig.extrapolateRight,
            coef,
            val,
            leftEdgeOutput,
            rightEdgeOutput,
            x
        );
    }

    return val;
}

/**
 * Lets you map a value from one range to another using linear interpolation.
 *
 * @param x - A number from the input range to be mapped.
 * @param inputRange - An array of numbers specifying the input range.
 * @param outputRange - An array of numbers specifying the output range.
 * @param type - Determines what happens when x goes beyond the input range.
 * @returns A mapped value within the output range.
 * @see https://docs.swmansion.com/react-native-reanimated/docs/utilities/interpolate
 */
export function interpolate(x, inputRange, outputRange, type) {
    'worklet';
    if (inputRange.length < 2 || outputRange.length < 2) {
        throw new ReanimatedError(
            'Interpolation input and output ranges should contain at least two values.'
        );
    }

    const extrapolationConfig = validateType(type);
    const length = inputRange.length;
    let narrowedInput = {
        leftEdgeInput: inputRange[0],
        rightEdgeInput: inputRange[1],
        leftEdgeOutput: outputRange[0],
        rightEdgeOutput: outputRange[1],
    };
    if (length > 2) {
        if (x > inputRange[length - 1]) {
            narrowedInput = {
                leftEdgeInput: inputRange[length - 2],
                rightEdgeInput: inputRange[length - 1],
                leftEdgeOutput: outputRange[length - 2],
                rightEdgeOutput: outputRange[length - 1],
            };
        } else {
            for (let i = 1; i < length; ++i) {
                if (x <= inputRange[i]) {
                    narrowedInput = {
                        leftEdgeInput: inputRange[i - 1],
                        rightEdgeInput: inputRange[i],
                        leftEdgeOutput: outputRange[i - 1],
                        rightEdgeOutput: outputRange[i],
                    };
                    break;
                }
            }
        }
    }
    return internalInterpolate(x, narrowedInput, extrapolationConfig);
}

/**
 * Lets you limit a value within a specified range.
 *
 * @param value - A number that will be returned as long as it is within the min and max.
 * @param min - The lower bound; returned if value is lower.
 * @param max - The upper bound; returned if value is higher.
 * @returns A number between min and max.
 * @see https://docs.swmansion.com/react-native-reanimated/docs/utilities/clamp/
 */
export function clamp(value, min, max) {
    'worklet';
    return Math.min(Math.max(value, min), max);
}

//
// --- Existing SSR Stub Implementations ---
//

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
};

// Runs a function on the JavaScript thread.
export function runOnJS(fn) {
    return fn;
}

// Runs a function on the UI thread; here just returns the function.
export function runOnUI(fn) {
    return fn;
}

// A stub for useAnimatedRef hook.
export function useAnimatedRef() {
    return { current: null };
}

// Stub for measuring layouts.
export function measure() {
    return { x: 0, y: 0, width: 0, height: 0 };
}

//
// --- Default Export ---
//

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
    clamp,
    useAnimatedRef,
    measure,
};
