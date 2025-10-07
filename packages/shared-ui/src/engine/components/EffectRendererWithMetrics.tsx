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
    readonly sizing?: 'container' | 'viewport';
};

type MetricsState = {
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
    readonly offsetX: number;
    readonly offsetY: number;
};

const hasPositiveArea = (value: MetricsState): boolean =>
    value.width > 0 && value.height > 0;

const stabilizeMetrics = (
    current: MetricsState,
    candidate: MetricsState
): MetricsState => {
    if (!hasPositiveArea(candidate) && hasPositiveArea(current)) {
        return current;
    }
    if (
        current.width === candidate.width &&
        current.height === candidate.height &&
        current.dpr === candidate.dpr &&
        current.offsetX === candidate.offsetX &&
        current.offsetY === candidate.offsetY
    ) {
        return current;
    }
    return candidate;
};

const useMetrics = (
    rootRef: React.RefObject<HTMLDivElement | null>,
    padding: number,
    sizing: 'container' | 'viewport'
) => {
    const [{ width, height, dpr, offsetX, offsetY }, setMetrics] =
        useState<MetricsState>({
            width: 0,
            height: 0,
            dpr: 1,
            offsetX: 0,
            offsetY: 0,
        });
    useEffect(() => {
        console.log('[EffectRendererWithMetrics] platform check', {
            platform: Platform.OS,
            sizing,
        });
        if (Platform.OS !== 'web') {
            return undefined;
        }
        const windowLike = globalThis as Window & typeof globalThis;

        const computeViewportMetrics = () => {
            const root = rootRef.current;
            if (!root) {
                console.log(
                    '[EffectRendererWithMetrics] root missing during viewport compute'
                );
                return;
            }
            const target = root.parentElement ?? root;
            const targetRect = target.getBoundingClientRect();
            const pixelRatio = windowLike.devicePixelRatio ?? 1;
            const nextWidth = Math.max(0, targetRect.width + padding * 2);
            const nextHeight = Math.max(0, targetRect.height + padding * 2);
            const nextOffsetX = targetRect.left - padding;
            const nextOffsetY = targetRect.top - padding;
            setMetrics((current) => {
                const next = stabilizeMetrics(current, {
                    width: nextWidth,
                    height: nextHeight,
                    dpr: pixelRatio,
                    offsetX: nextOffsetX,
                    offsetY: nextOffsetY,
                });
                if (next === current) {
                    return current;
                }
                console.log(
                    '[EffectRendererWithMetrics] compute viewport metrics',
                    {
                        width: next.width,
                        height: next.height,
                        padding,
                        pixelRatio: next.dpr,
                        offsetX: next.offsetX,
                        offsetY: next.offsetY,
                    }
                );
                return next;
            });
        };

        const computeContainerMetrics = (root: HTMLDivElement) => {
            const rootRect = root.getBoundingClientRect();
            const contentWidth = Math.max(0, rootRect.width);
            const contentHeight = Math.max(0, rootRect.height);
            const pixelRatio = windowLike.devicePixelRatio ?? 1;
            setMetrics((current) => {
                const next = stabilizeMetrics(current, {
                    width: contentWidth,
                    height: contentHeight,
                    dpr: pixelRatio,
                    offsetX: 0,
                    offsetY: 0,
                });
                if (next === current) {
                    return current;
                }
                console.log(
                    '[EffectRendererWithMetrics] compute container metrics',
                    {
                        width: next.width,
                        height: next.height,
                        padding,
                        pixelRatio: next.dpr,
                    }
                );
                return next;
            });
        };

        if (sizing === 'viewport') {
            const compute = () => computeViewportMetrics();
            computeViewportMetrics();
            const scrollTarget = rootRef.current?.parentElement;
            const ResizeObserverCtor = (
                globalThis as unknown as {
                    ResizeObserver?: typeof ResizeObserver;
                }
            ).ResizeObserver;
            let resizeObserver: ResizeObserver | undefined;
            if (ResizeObserverCtor && scrollTarget) {
                resizeObserver = new ResizeObserverCtor(() => compute());
                resizeObserver.observe(scrollTarget);
            }
            globalThis.addEventListener('resize', compute);
            globalThis.addEventListener('scroll', compute, true);
            return () => {
                resizeObserver?.disconnect();
                globalThis.removeEventListener('resize', compute);
                globalThis.removeEventListener('scroll', compute, true);
            };
        }

        const root = rootRef.current;
        if (!root) {
            console.log(
                '[EffectRendererWithMetrics] root missing at effect run'
            );
            return undefined;
        }
        const compute = () => computeContainerMetrics(root);
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
    }, [padding, rootRef, sizing]);
    return useMemo(
        () => ({ width, height, dpr, offsetX, offsetY }),
        [dpr, height, offsetX, offsetY, width]
    );
};

export const EffectRendererWithMetrics = <
    State extends EngineState,
    UniformData,
>({
    padding = 0,
    borderRadius = 0,
    containerStyle,
    state,
    sizing = 'container',
    ...props
}: EffectRendererWithMetricsProps<
    State,
    UniformData
>): React.ReactElement | null => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [canvasVersion, setCanvasVersion] = useState(0);
    const { width, height, dpr, offsetX, offsetY } = useMetrics(
        rootRef,
        padding,
        sizing
    );

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

    const rootStyle: React.CSSProperties =
        sizing === 'viewport'
            ? {
                  position: 'fixed',
                  top: offsetY,
                  left: offsetX,
                  width,
                  height,
                  borderRadius,
                  overflow: 'visible',
                  pointerEvents: 'none',
                  zIndex: 0,
              }
            : {
                  position: 'absolute',
                  top: -padding,
                  right: -padding,
                  bottom: -padding,
                  left: -padding,
                  borderRadius,
                  overflow: 'visible',
                  pointerEvents: 'none',
                  zIndex: 0,
              };

    return (
        <div ref={rootRef} style={rootStyle}>
            {width > 0 && height > 0 ? (
                <EffectRenderer
                    {...props}
                    state={mergedState}
                    key={canvasVersion}
                    onFailure={(error) => {
                        setCanvasVersion((value) => value + 1);
                        props.onFailure?.(error);
                    }}
                    containerStyle={containerStyle}
                />
            ) : null}
        </div>
    );
};
