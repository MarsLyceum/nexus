import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { EffectRenderer } from './EffectRenderer';
import { Backend, EffectDescriptor, EngineState, Timeline } from '../types';

export type EffectRendererWithMetricsProps<
    State extends EngineState,
    UniformData,
> = {
    readonly descriptor: EffectDescriptor<State, UniformData>;
    readonly timeline: Timeline;
    readonly state: Partial<State>;
    readonly padding?: number;
    readonly borderRadius?: number;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly preferredBackend?: string;
    readonly containerStyle?: React.CSSProperties;
    readonly canvasStyle?: React.CSSProperties;
    readonly onFailure?: (error: Error) => void;
    readonly onReady?: () => void;
    readonly onBackendChange?: (backend: string) => void;
};

const useMetrics = (
    rootRef: React.RefObject<HTMLDivElement | null>,
    padding: number
) => {
    const [{ width, height, dpr }, setMetrics] = useState({
        width: 0,
        height: 0,
        dpr: 1,
    });
    useEffect(() => {
        console.log('[EffectRendererWithMetrics] platform check', {
            platform: Platform.OS,
        });
        if (Platform.OS !== 'web') {
            return undefined;
        }
        const root = rootRef.current;
        if (!root) {
            console.log(
                '[EffectRendererWithMetrics] root missing at effect run'
            );
            return undefined;
        }
        const compute = () => {
            const parentRect = root.parentElement?.getBoundingClientRect();
            const rect = parentRect ?? root.getBoundingClientRect();
            const pixelRatio =
                (globalThis as Window & typeof globalThis).devicePixelRatio ??
                1;
            setMetrics({
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
                dpr: pixelRatio,
            });
            console.log('[EffectRendererWithMetrics] compute metrics', {
                width: rect.width,
                height: rect.height,
                padding,
                widthWithPadding: rect.width + padding * 2,
                heightWithPadding: rect.height + padding * 2,
                pixelRatio,
            });
        };
        compute();
        const ResizeObserverCtor = (
            globalThis as unknown as { ResizeObserver?: typeof ResizeObserver }
        ).ResizeObserver;
        if (ResizeObserverCtor) {
            const observer = new ResizeObserverCtor(compute);
            observer.observe(root);
            globalThis.addEventListener('resize', compute as EventListener);
            return () => {
                observer.disconnect();
                globalThis.removeEventListener(
                    'resize',
                    compute as EventListener
                );
            };
        }
        const interval = setInterval(compute, 200);
        globalThis.addEventListener('resize', compute as EventListener);
        return () => {
            clearInterval(interval);
            globalThis.removeEventListener('resize', compute as EventListener);
        };
    }, [padding, rootRef]);
    return useMemo(() => ({ width, height, dpr }), [dpr, height, width]);
};

export const EffectRendererWithMetrics = <
    State extends EngineState,
    UniformData,
>({
    padding = 0,
    borderRadius = 0,
    containerStyle,
    state,
    ...props
}: EffectRendererWithMetricsProps<
    State,
    UniformData
>): React.ReactElement | null => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const { width, height, dpr } = useMetrics(rootRef, padding);

    const mergedState = useMemo(
        () => ({
            ...state,
            width,
            height,
            dpr,
        }),
        [state, width, height, dpr]
    );

    useEffect(() => {
        console.log('[EffectRendererWithMetrics] metrics updated', {
            width,
            height,
            dpr,
        });
    }, [width, height, dpr]);

    if (Platform.OS !== 'web') {
        return null;
    }

    return (
        <div
            ref={rootRef}
            style={{
                position: 'absolute',
                top: -padding,
                right: -padding,
                bottom: -padding,
                left: -padding,
                borderRadius,
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        >
            <EffectRenderer
                {...props}
                state={mergedState}
                containerStyle={containerStyle}
            />
        </div>
    );
};
