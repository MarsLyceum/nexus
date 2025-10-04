import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { useEffectEngine } from '../hooks/useEffectEngine';
import { Backend, EffectDescriptor, EngineState, Timeline } from '../types';

export type EffectRendererProps<State extends EngineState, UniformData> = {
    readonly descriptor: EffectDescriptor<State, UniformData>;
    readonly timeline: Timeline;
    readonly state: Partial<State>;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly preferredBackend?: string;
    readonly containerStyle?: React.CSSProperties;
    readonly canvasStyle?: React.CSSProperties;
    readonly onFailure?: (error: Error) => void;
    readonly onReady?: () => void;
    readonly onBackendChange?: (backend: string) => void;
};

export const EffectRenderer = <State extends EngineState, UniformData>({
    descriptor,
    timeline,
    state,
    backends,
    preferredBackend = 'auto',
    containerStyle,
    canvasStyle,
    onFailure,
    onReady,
    onBackendChange,
}: EffectRendererProps<State, UniformData>): React.ReactElement | null => {
    const [canvasElement, setCanvasElement] =
        useState<HTMLCanvasElement | null>(null);
    const [backendId, setBackendId] = useState('unknown');
    const [hasInitError, setHasInitError] = useState(false);
    const [canvasKey, setCanvasKey] = useState(0);

    const resolvedBackends = useMemo(
        () => (backends ? [...backends] : descriptor.createBackends()),
        [backends, descriptor]
    );

    useEffect(() => {
        console.log('[EffectRenderer] preferred backend updated', {
            preferredBackend,
            descriptorId: descriptor.id,
        });
    }, [preferredBackend, descriptor.id]);

    useEffect(() => {
        setCanvasKey((prev) => prev + 1);
        setCanvasElement(null);
        setBackendId('unknown');
        setHasInitError(false);
    }, [preferredBackend]);

    const engineResult = useEffectEngine({
        descriptor,
        timeline,
        canvas: canvasElement,
        state,
        backends: resolvedBackends,
        desiredBackend: preferredBackend,
        onBackendChange: (next) => {
            console.log('[EffectRenderer] onBackendChange callback', {
                descriptorId: descriptor.id,
                next,
                HTMLElementWidth: canvasElement?.parentElement?.clientWidth,
                HTMLElementHeight: canvasElement?.parentElement?.clientHeight,
            });
            setBackendId(next);
            setHasInitError(next === 'none');
            onBackendChange?.(next);
        },
        onReady,
        onError: (error) => {
            setHasInitError(true);
            onFailure?.(error);
        },
    });

    useEffect(() => {
        console.log('[EffectRenderer] engine result backend change', {
            descriptorId: descriptor.id,
            engineBackendId: engineResult.backendId,
        });
    }, [engineResult.backendId, descriptor.id]);

    useEffect(() => {
        console.log('[EffectRenderer] backend state updated', {
            descriptorId: descriptor.id,
            backendId,
            hasInitError,
        });
    }, [backendId, hasInitError, descriptor.id]);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        setBackendId(engineResult.backendId);
    }, [engineResult.backendId]);

    if (Platform.OS !== 'web') {
        console.log(
            '[EffectRenderer] non-web platform detected, rendering null',
            {
                descriptorId: descriptor.id,
            }
        );
        return null;
    }

    if (backendId === 'none' || hasInitError) {
        console.log('[EffectRenderer] backend unavailable, returning null', {
            descriptorId: descriptor.id,
            backendId,
            hasInitError,
        });
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: backendId === 'unknown' ? 0 : 1,
                ...containerStyle,
            }}
        >
            <canvas
                key={canvasKey}
                ref={setCanvasElement}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    ...canvasStyle,
                }}
            />
        </div>
    );
};
