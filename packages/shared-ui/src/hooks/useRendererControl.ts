import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';

export type RendererBackend = string;

export type RendererStatus = 'initializing' | 'ready' | 'failed' | 'rendering';

export type RendererDiagnostics = {
    readonly failedBackends: ReadonlyArray<string>;
    readonly backendErrors: Record<string, Error>;
    readonly attemptedBackends: ReadonlyArray<string>;
};

export type RendererControlAvailability<Backend extends RendererBackend> =
    Record<Backend, boolean>;

export type UseRendererControlOptions<Backend extends RendererBackend> = {
    readonly availability: RendererControlAvailability<Backend>;
    readonly initialPreferredBackend?: Backend | 'auto';
    readonly initialActiveBackend?: Backend | 'auto';
    readonly initialStatus?: RendererStatus;
    readonly initialDiagnostics?: RendererDiagnostics;
    readonly initialRendererLocked?: boolean;
    readonly allowAuto?: boolean;
};

export type UseRendererControlResult<Backend extends RendererBackend> = {
    readonly availability: RendererControlAvailability<Backend>;
    readonly preferredBackend: Backend | 'auto';
    readonly activeBackend: Backend | 'auto';
    readonly status: RendererStatus;
    readonly diagnostics: RendererDiagnostics;
    readonly rendererLocked: boolean;
    readonly setBackend: (backend: Backend | 'auto') => void;
    readonly setPreferredBackend: Dispatch<SetStateAction<Backend | 'auto'>>;
    readonly setActiveBackend: Dispatch<SetStateAction<Backend | 'auto'>>;
    readonly setStatus: Dispatch<SetStateAction<RendererStatus>>;
    readonly setDiagnostics: Dispatch<SetStateAction<RendererDiagnostics>>;
    readonly setRendererLocked: Dispatch<SetStateAction<boolean>>;
    readonly isBackendAvailable: (backend: Backend) => boolean;
};

const createDefaultDiagnostics = (): RendererDiagnostics => ({
    failedBackends: [],
    backendErrors: {},
    attemptedBackends: [],
});

const findFirstAvailable = <Backend extends RendererBackend>(
    availability: RendererControlAvailability<Backend>
): Backend | null =>
    (Object.entries(availability) as Array<[Backend, boolean]>).find(
        ([, isAvailable]) => isAvailable
    )?.[0] ?? null;

export const useRendererControl = <Backend extends RendererBackend>(
    options: UseRendererControlOptions<Backend>
): UseRendererControlResult<Backend> => {
    const {
        availability,
        initialPreferredBackend,
        initialActiveBackend,
        initialStatus = 'initializing',
        initialDiagnostics = createDefaultDiagnostics(),
        initialRendererLocked = true,
        allowAuto = true,
    } = options;

    const availabilityRef = useRef(availability);
    useEffect(() => {
        availabilityRef.current = availability;
    }, [availability]);

    const firstAvailable = useMemo(
        () => findFirstAvailable(availability),
        [availability]
    );

    const resolveInitialBackend = useCallback(
        (candidate: Backend | 'auto' | undefined): Backend | 'auto' => {
            if (candidate === undefined) {
                if (allowAuto) {
                    return 'auto';
                }
                return (
                    firstAvailable ?? (Object.keys(availability)[0] as Backend)
                );
            }
            if (candidate === 'auto') {
                if (allowAuto) {
                    return 'auto';
                }
                return (
                    firstAvailable ?? (Object.keys(availability)[0] as Backend)
                );
            }
            if (availability[candidate]) {
                return candidate;
            }
            if (allowAuto) {
                return 'auto';
            }
            return firstAvailable ?? candidate;
        },
        [allowAuto, availability, firstAvailable]
    );

    const [preferredBackend, setPreferredBackend] = useState<Backend | 'auto'>(
        () => resolveInitialBackend(initialPreferredBackend)
    );

    const [activeBackend, setActiveBackend] = useState<Backend | 'auto'>(() =>
        resolveInitialBackend(initialActiveBackend ?? initialPreferredBackend)
    );

    const [status, setStatus] = useState<RendererStatus>(initialStatus);
    const [diagnostics, setDiagnostics] =
        useState<RendererDiagnostics>(initialDiagnostics);
    const [rendererLocked, setRendererLocked] = useState<boolean>(
        initialRendererLocked
    );

    useEffect(() => {
        if (preferredBackend === 'auto') {
            return;
        }
        if (!availability[preferredBackend]) {
            setPreferredBackend((current) => {
                if (current === 'auto') {
                    return current;
                }
                if (allowAuto) {
                    return 'auto';
                }
                return firstAvailable ?? current;
            });
        }
    }, [allowAuto, availability, firstAvailable, preferredBackend]);

    const isBackendAvailable = useCallback(
        (backend: Backend) => Boolean(availabilityRef.current[backend]),
        []
    );

    const setBackend = useCallback(
        (backend: Backend | 'auto') => {
            if (backend === 'auto') {
                if (allowAuto) {
                    setPreferredBackend('auto');
                }
                return;
            }
            if (!availabilityRef.current[backend]) {
                return;
            }
            setPreferredBackend(backend);
        },
        [allowAuto]
    );

    return {
        availability,
        preferredBackend,
        activeBackend,
        status,
        diagnostics,
        rendererLocked,
        setBackend,
        setPreferredBackend,
        setActiveBackend,
        setStatus,
        setDiagnostics,
        setRendererLocked,
        isBackendAvailable,
    };
};
