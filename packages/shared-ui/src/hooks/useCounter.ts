import { useState, useMemo, useCallback } from 'react';

export interface CounterActions {
    inc: (delta?: number) => void;
    dec: (delta?: number) => void;
    get: () => number;
    set: (value: number | ((prevValue: number) => number)) => void;
    reset: (value?: number | ((prevValue: number) => number)) => void;
}

const resolveHookState = <T>(
    newState: T | ((prevState: T) => T),
    prevState: T
): T => {
    if (typeof newState === 'function') {
        return (newState as (prevState: T) => T)(prevState);
    }
    return newState;
};

export const useCounter = (
    initialValue: number = 0,
    max: number | undefined = undefined,
    min: number | undefined = undefined
): [number, CounterActions] => {
    const [state, setState] = useState<number>(() => {
        let init = initialValue;

        if (typeof min === 'number') {
            init = Math.max(init, min);
        } else if (min !== null) {
            console.error('min has to be a number, got:', typeof min);
        }

        if (typeof max === 'number') {
            init = Math.min(init, max);
        } else if (max !== null) {
            console.error('max has to be a number, got:', typeof max);
        }

        return init;
    });

    const get = useCallback(() => state, [state]);

    const set = useCallback(
        (newState: number | ((prevState: number) => number)) => {
            setState((prevState) => {
                let resolvedState = resolveHookState(newState, prevState);

                if (typeof min === 'number') {
                    resolvedState = Math.max(resolvedState, min);
                }
                if (typeof max === 'number') {
                    resolvedState = Math.min(resolvedState, max);
                }

                return resolvedState;
            });
        },
        [min, max]
    );

    const inc = useCallback(
        (delta: number = 1) => {
            setState((prevState) => {
                let newValue = prevState + delta;

                if (typeof max === 'number') {
                    newValue = Math.min(newValue, max);
                }

                return newValue;
            });
        },
        [max]
    );

    const dec = useCallback(
        (delta: number = 1) => {
            setState((prevState) => {
                let newValue = prevState - delta;

                if (typeof min === 'number') {
                    newValue = Math.max(newValue, min);
                }

                return newValue;
            });
        },
        [min]
    );

    const reset = useCallback(
        (value: number | ((prevState: number) => number) = initialValue) => {
            let resolvedValue = resolveHookState(value, state);

            if (typeof min === 'number') {
                resolvedValue = Math.max(resolvedValue, min);
            }
            if (typeof max === 'number') {
                resolvedValue = Math.min(resolvedValue, max);
            }

            setState(resolvedValue);
        },
        [initialValue, min, max, state]
    );

    const actions = useMemo(
        () => ({ inc, dec, get, set, reset }),
        [inc, dec, get, set, reset]
    );

    return [state, actions];
};
