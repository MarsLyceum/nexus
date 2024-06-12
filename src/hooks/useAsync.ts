import { useState, useEffect, useCallback, DependencyList } from 'react';

interface AsyncState<T> {
    loading: boolean;
    error: Error | undefined;
    value: T | undefined;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
    execute: () => void;
}

export const useAsync = <T>(
    asyncFunction: () => Promise<T>,
    dependencies: DependencyList = []
): UseAsyncReturn<T> => {
    const [state, setState] = useState<AsyncState<T>>({
        loading: false,
        error: undefined,
        value: undefined,
    });

    const execute = useCallback(() => {
        setState({ loading: true, error: undefined, value: undefined });
        return asyncFunction()
            .then((response) => {
                setState({ loading: false, error: undefined, value: response });
                return response;
            })
            .catch((error: Error | undefined) => {
                setState({ loading: false, error, value: undefined });
                if (error) {
                    throw error;
                }
            });
    }, [asyncFunction]);

    useEffect(() => {
        // eslint-disable-next-line no-void
        void execute();
    }, [execute, ...dependencies]);

    return { ...state, execute };
};
