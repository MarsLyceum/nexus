import { useEffect, useMemo, useRef, useState } from 'react';

import { createEffectEngine } from '../effectSystem';
import { Backend, EffectDescriptor, EngineState, Timeline } from '../types';

export type UseEffectEngineOptions<State extends EngineState, UniformData> = {
    readonly descriptor: EffectDescriptor<State, UniformData>;
    readonly timeline: Timeline;
    readonly canvas: HTMLCanvasElement | null;
    readonly state: Partial<State>;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly desiredBackend?: string;
    readonly onBackendChange?: (backend: string | undefined) => void;
    readonly onReady?: () => void;
    readonly onError?: (error: Error) => void;
};

export type UseEffectEngineResult = {
    readonly backendId: string | undefined;
};

export const useEffectEngine = <State extends EngineState, UniformData>({
    descriptor,
    timeline,
    canvas,
    state,
    backends,
    desiredBackend = 'auto',
    onBackendChange,
    onReady,
    onError,
}: UseEffectEngineOptions<State, UniformData>): UseEffectEngineResult => {
    const [backendId, setBackendId] = useState<string | undefined>(undefined);
    const engineRef = useRef<ReturnType<
        typeof createEffectEngine<State, UniformData>
    > | null>(null);
    const backendChangeRef = useRef<
        ((backend: string | undefined) => void) | undefined
    >(onBackendChange);
    const readyRef = useRef<(() => void) | undefined>(onReady);
    const errorRef = useRef<((error: Error) => void) | undefined>(onError);
    const desiredBackendRef = useRef(desiredBackend);
    const stateRef = useRef(state);
    const disposingRef = useRef(false);
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
        if (!engineRef.current) {
            console.log(
                '[useEffectEngine] setDesiredBackend queued, no engine',
                {
                    descriptorId: descriptor.id,
                    desiredBackend,
                }
            );
            return;
        }
        console.log('[useEffectEngine] setDesiredBackend invoked', {
            descriptorId: descriptor.id,
            desiredBackend,
        });
        void engineRef.current.setDesiredBackend(desiredBackend);
    }, [desiredBackend, descriptor.id]);

    useEffect(() => {
        stateRef.current = state;
        if (!engineRef.current) {
            console.log('[useEffectEngine] state update queued, no engine', {
                descriptorId: descriptor.id,
            });
            return;
        }
        console.log('[useEffectEngine] updating engine state', {
            descriptorId: descriptor.id,
        });
        engineRef.current.update(state);
    }, [descriptor.id, state]);

    useEffect(() => {
        if (!canvas) {
            console.log('[useEffectEngine] no canvas available yet', {
                descriptorId: descriptor.id,
                desiredBackend: desiredBackendRef.current,
            });
            return undefined;
        }
        console.log('[useEffectEngine] canvas available', {
            descriptorId: descriptor.id,
            desiredBackend: desiredBackendRef.current,
            connected: canvas.isConnected,
            width: canvas.width,
            height: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
        });
        const preferredOrder =
            desiredBackendRef.current === 'auto'
                ? undefined
                : [desiredBackendRef.current];
        disposingRef.current = false;
        const engine = createEffectEngine({
            canvas,
            timeline,
            descriptor,
            backends,
            backendPreference: preferredOrder,
            onBackendChange: (backend) => {
                console.log('[useEffectEngine] backend change reported', {
                    descriptorId: descriptor.id,
                    backend,
                });
                if (disposingRef.current) {
                    return;
                }
                setBackendId((current) =>
                    current === backend ? current : backend
                );
                backendChangeRef.current?.(backend);
            },
            onReady: () => {
                readyRef.current?.();
            },
            onError: (error) => {
                errorRef.current?.(error);
            },
        });
        engineRef.current = engine;
        console.log('[useEffectEngine] engine created', {
            descriptorId: descriptor.id,
            desiredBackend: desiredBackendRef.current,
        });
        const desired = desiredBackendRef.current;
        if (desired && desired !== 'auto') {
            console.log('[useEffectEngine] applying initial desired backend', {
                descriptorId: descriptor.id,
                desiredBackend: desired,
            });
            void engine.setDesiredBackend(desired);
        }
        console.log('[useEffectEngine] applying initial state', {
            descriptorId: descriptor.id,
        });
        engine.update(stateRef.current);
        engine.start();
        console.log('[useEffectEngine] engine started', {
            descriptorId: descriptor.id,
        });
        return () => {
            disposingRef.current = true;
            console.log('[useEffectEngine] disposing engine', {
                descriptorId: descriptor.id,
            });
            engine.dispose();
            engineRef.current = null;
        };
    }, [backends, canvas, descriptor, timeline]);

    return useMemo(() => ({ backendId }), [backendId]);
};
