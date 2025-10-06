import { useEffect, useMemo } from 'react';

import {
    type RendererBackend,
    type RendererControlAvailability,
    type RendererDiagnostics,
    type RendererStatus,
    type StateSetter,
    useNexusStore,
    findFirstAvailable,
    resolveBackendCandidate,
    createDefaultDiagnostics,
    areAvailabilityMapsEqual,
} from '../store';

export type UseRendererControlOptions<
    Backend extends RendererBackend = RendererBackend,
> = {
    readonly availability: RendererControlAvailability<Backend>;
    readonly initialPreferredBackend?: Backend | 'auto';
    readonly initialActiveBackend?: Backend | 'auto';
    readonly initialStatus?: RendererStatus;
    readonly initialDiagnostics?: RendererDiagnostics;
    readonly initialRendererLocked?: boolean;
    readonly allowAuto?: boolean;
};

export type UseRendererControlResult<
    Backend extends RendererBackend = RendererBackend,
> = {
    readonly availability: RendererControlAvailability<Backend>;
    readonly preferredBackend: Backend | 'auto';
    readonly activeBackend: Backend | 'auto';
    readonly status: RendererStatus;
    readonly diagnostics: RendererDiagnostics;
    readonly rendererLocked: boolean;
    readonly setBackend: (backend: Backend | 'auto') => void;
    readonly setPreferredBackend: StateSetter<Backend | 'auto'>;
    readonly setActiveBackend: StateSetter<Backend | 'auto'>;
    readonly setStatus: StateSetter<RendererStatus>;
    readonly setDiagnostics: StateSetter<RendererDiagnostics>;
    readonly setRendererLocked: StateSetter<boolean>;
    readonly isBackendAvailable: (backend: Backend) => boolean;
};

export const useRendererControl = <Backend extends RendererBackend>(
    options: UseRendererControlOptions<Backend>
): UseRendererControlResult<Backend> => {
    const {
        availability: availabilityOptions,
        initialPreferredBackend,
        initialActiveBackend,
        initialStatus,
        initialDiagnostics,
        initialRendererLocked,
        allowAuto,
    } = options;

    const availability = useNexusStore(
        ({ availability: nextAvailability }) => nextAvailability
    );
    const preferredBackend = useNexusStore(
        ({ preferredBackend: nextPreferredBackend }) => nextPreferredBackend
    );
    const activeBackend = useNexusStore(
        ({ activeBackend: nextActiveBackend }) => nextActiveBackend
    );
    const status = useNexusStore(({ status: nextStatus }) => nextStatus);
    const diagnostics = useNexusStore(
        ({ diagnostics: nextDiagnostics }) => nextDiagnostics
    );
    const rendererLocked = useNexusStore(
        ({ rendererLocked: nextRendererLocked }) => nextRendererLocked
    );
    const setBackendAction = useNexusStore(({ setBackend }) => setBackend);
    const setPreferredBackendAction = useNexusStore(
        ({ setPreferredBackend }) => setPreferredBackend
    );
    const setActiveBackendAction = useNexusStore(
        ({ setActiveBackend }) => setActiveBackend
    );
    const setStatusAction = useNexusStore(({ setStatus }) => setStatus);
    const setDiagnosticsAction = useNexusStore(
        ({ setDiagnostics }) => setDiagnostics
    );
    const setRendererLockedAction = useNexusStore(
        ({ setRendererLocked }) => setRendererLocked
    );
    const isBackendAvailable = useNexusStore(
        ({ isBackendAvailable: nextIsBackendAvailable }) =>
            nextIsBackendAvailable
    );

    useEffect(() => {
        const resolvedAllowAuto = allowAuto ?? true;
        const nextAvailability = availabilityOptions;
        const initialDiagnosticsSeed =
            initialDiagnostics ?? createDefaultDiagnostics();
        const initialStatusSeed = initialStatus ?? 'initializing';
        const initialRendererLockedSeed = initialRendererLocked ?? true;

        useNexusStore.setState((state) => {
            const availabilityChanged = !areAvailabilityMapsEqual(
                state.availability,
                nextAvailability
            );
            const firstAvailable = findFirstAvailable(nextAvailability);
            const preferredCandidate = state.hasHydrated
                ? state.preferredBackend
                : initialPreferredBackend ?? state.preferredBackend;
            const activeCandidate = state.hasHydrated
                ? state.activeBackend
                : initialActiveBackend ??
                  initialPreferredBackend ??
                  state.activeBackend;

            const nextPreferred = resolveBackendCandidate(
                preferredCandidate,
                nextAvailability,
                resolvedAllowAuto,
                firstAvailable,
                state.preferredBackend
            );

            const nextActive = resolveBackendCandidate(
                activeCandidate,
                nextAvailability,
                resolvedAllowAuto,
                firstAvailable,
                state.activeBackend
            );

            const statusSeed = state.hasHydrated
                ? state.status
                : initialStatusSeed;
            const diagnosticsSeed = state.hasHydrated
                ? state.diagnostics
                : initialDiagnosticsSeed;
            const rendererLockedSeed = state.hasHydrated
                ? state.rendererLocked
                : initialRendererLockedSeed;

            const allowAutoChanged = state.allowAuto !== resolvedAllowAuto;
            const preferredChanged = nextPreferred !== state.preferredBackend;
            const activeChanged = nextActive !== state.activeBackend;
            const statusChanged = statusSeed !== state.status;
            const diagnosticsChanged = diagnosticsSeed !== state.diagnostics;
            const rendererLockedChanged =
                rendererLockedSeed !== state.rendererLocked;
            const hydrationChanged = state.hasHydrated === false;

            if (
                !availabilityChanged &&
                !allowAutoChanged &&
                !preferredChanged &&
                !activeChanged &&
                !statusChanged &&
                !diagnosticsChanged &&
                !rendererLockedChanged &&
                !hydrationChanged
            ) {
                return state;
            }

            return {
                ...state,
                availability: nextAvailability,
                preferredBackend: nextPreferred,
                activeBackend: nextActive,
                status: statusSeed,
                diagnostics: diagnosticsSeed,
                rendererLocked: rendererLockedSeed,
                allowAuto: resolvedAllowAuto,
                hasHydrated: true,
            };
        });
    }, [
        allowAuto,
        availabilityOptions,
        initialActiveBackend,
        initialDiagnostics,
        initialPreferredBackend,
        initialRendererLocked,
        initialStatus,
    ]);

    return useMemo<UseRendererControlResult<Backend>>(
        () => ({
            availability: availability as RendererControlAvailability<Backend>,
            preferredBackend: preferredBackend as Backend | 'auto',
            activeBackend: activeBackend as Backend | 'auto',
            status,
            diagnostics,
            rendererLocked,
            setBackend: (backend) => setBackendAction(backend),
            setPreferredBackend: (update) =>
                setPreferredBackendAction(
                    update as StateSetter<Backend | 'auto'>
                ),
            setActiveBackend: (update) =>
                setActiveBackendAction(update as StateSetter<Backend | 'auto'>),
            setStatus: (update) =>
                setStatusAction(update as StateSetter<RendererStatus>),
            setDiagnostics: (update) =>
                setDiagnosticsAction(
                    update as StateSetter<RendererDiagnostics>
                ),
            setRendererLocked: (update) =>
                setRendererLockedAction(update as StateSetter<boolean>),
            isBackendAvailable: (backend) => isBackendAvailable(backend),
        }),
        [
            availability,
            preferredBackend,
            activeBackend,
            status,
            diagnostics,
            rendererLocked,
            setBackendAction,
            setPreferredBackendAction,
            setActiveBackendAction,
            setStatusAction,
            setDiagnosticsAction,
            setRendererLockedAction,
            isBackendAvailable,
        ]
    );
};
