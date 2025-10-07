import { useEffect, useMemo, useRef, useState } from 'react';

import { getEngineManager } from '../engineManager';
import type { EngineManagerSession } from '../engineManager';
import type { CanvasSurfaceHandle } from '../canvasManager';
import { Backend, EffectDescriptor, EngineState, Timeline } from '../types';

export type UseEffectEngineOptions<State extends EngineState, UniformData> = {
    readonly descriptor: EffectDescriptor<State, UniformData>;
    readonly timeline: Timeline;
    readonly state: Partial<State>;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly desiredBackend?: string;
    readonly zIndex: number;
    readonly groupId?: string;
    readonly groupZIndex?: number;
    readonly blendMode: GlobalCompositeOperation;
    readonly onBackendChange?: (backend: string | undefined) => void;
    readonly onReady?: () => void;
    readonly onError?: (error: Error) => void;
};

export type UseEffectEngineResult = {
    readonly backendId: string | undefined;
    readonly handle: CanvasSurfaceHandle | null;
};

export const useEffectEngine = <State extends EngineState, UniformData>({
    descriptor,
    timeline,
    state,
    backends,
    desiredBackend = 'auto',
    zIndex,
    groupId,
    groupZIndex,
    blendMode,
    onBackendChange,
    onReady,
    onError,
}: UseEffectEngineOptions<State, UniformData>): UseEffectEngineResult => {
    const [backendId, setBackendId] = useState<string | undefined>(undefined);
    const [handle, setHandle] = useState<CanvasSurfaceHandle | null>(null);
    const sessionRef = useRef<EngineManagerSession<State> | null>(null);
    const backendChangeRef = useRef(onBackendChange);
    const readyRef = useRef(onReady);
    const errorRef = useRef(onError);
    const desiredBackendRef = useRef(desiredBackend);
    const backendsRef = useRef(backends);
    const stateRef = useRef(state);

    useEffect(() => {
        backendChangeRef.current = onBackendChange;
    }, [onBackendChange]);

    useEffect(() => {
        readyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
        errorRef.current = onError;
    }, [onError]);

    useEffect(() => {
        desiredBackendRef.current = desiredBackend;
        if (!sessionRef.current) {
            return;
        }
        void sessionRef.current.setDesiredBackend(desiredBackend);
    }, [desiredBackend]);

    useEffect(() => {
        stateRef.current = state;
        if (!sessionRef.current) {
            return;
        }
        sessionRef.current.updateState(state);
    }, [state]);

    useEffect(() => {
        backendsRef.current = backends;
    }, [backends]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return undefined;
        }
        const manager = getEngineManager();
        const session = manager.attach<State, UniformData>({
            descriptor,
            timeline,
            state: stateRef.current,
            backends: backendsRef.current,
            desiredBackend: desiredBackendRef.current,
            zIndex,
            groupId,
            groupZIndex,
            blendMode,
            onBackendChange: (next) => {
                setBackendId(next);
                backendChangeRef.current?.(next);
            },
            onReady: () => readyRef.current?.(),
            onError: (error) => errorRef.current?.(error),
        });
        sessionRef.current = session;
        setHandle(session.handle);
        setBackendId(session.backendId);
        return () => {
            session.release();
            sessionRef.current = null;
            setHandle(null);
            setBackendId(undefined);
        };
    }, [blendMode, descriptor, groupId, groupZIndex, timeline, zIndex]);

    return useMemo(() => ({ backendId, handle }), [backendId, handle]);
};
