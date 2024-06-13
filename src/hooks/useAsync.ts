import { DependencyList, useEffect, useState, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FunctionReturningPromise<T> = (...args: any[]) => Promise<T>;

type AsyncState<T> =
    | { loading: boolean; error?: undefined; value?: undefined }
    | { loading: true; error?: Error | undefined; value?: T }
    | { loading: false; error: Error; value?: undefined }
    | { loading: false; error?: undefined; value: T };

type StateFromFunctionReturningPromise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends FunctionReturningPromise<any>,
> = AsyncState<ReturnType<T> extends Promise<infer R> ? R : never>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAsync<T extends FunctionReturningPromise<any>>(
    fn: T,
    deps: DependencyList = []
): StateFromFunctionReturningPromise<T> {
    const [state, setState] = useState<StateFromFunctionReturningPromise<T>>({
        loading: true,
    } as StateFromFunctionReturningPromise<T>);

    const callback = useCallback(() => {
        setState((prevState) => ({ ...prevState, loading: true }));

        // eslint-disable-next-line promise/catch-or-return
        fn().then(
            (value) =>
                setState({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    value,
                    loading: false,
                } as StateFromFunctionReturningPromise<T>),
            (error) =>
                setState({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    error,
                    loading: false,
                } as StateFromFunctionReturningPromise<T>)
        );
    }, deps);

    useEffect(() => {
        callback();
    }, [callback]);

    return state;
}
