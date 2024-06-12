import { DependencyList, useEffect, useState, useCallback } from 'react';

type FunctionReturningPromise = <T>(...args: T[]) => Promise<T>;

type AsyncState<T> =
    | { loading: boolean; error?: undefined; value?: undefined }
    | { loading: true; error?: Error | undefined; value?: T }
    | { loading: false; error: Error; value?: undefined }
    | { loading: false; error?: undefined; value: T };

type StateFromFunctionReturningPromise<T extends FunctionReturningPromise> =
    AsyncState<ReturnType<T> extends Promise<infer R> ? R : never>;

export function useAsync<T extends FunctionReturningPromise>(
    fn: T,
    deps: DependencyList = []
): StateFromFunctionReturningPromise<T> {
    const [state, setState] = useState<StateFromFunctionReturningPromise<T>>({
        loading: true,
    });

    const callback = useCallback(() => {
        setState((prevState) => ({ ...prevState, loading: true }));

        // eslint-disable-next-line promise/catch-or-return
        fn().then(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            (value) => setState({ value, loading: false }),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            (error) => setState({ error, loading: false })
        );
    }, deps);

    useEffect(() => {
        callback();
    }, [callback]);

    return state;
}
