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
    readonly snapshotStyle?: React.CSSProperties;
    readonly onFailure?: (error: Error) => void;
    readonly onReady?: () => void;
    readonly sizing?: 'container' | 'viewport';
    readonly zIndex?: number;
    readonly groupId?: string;
    readonly groupZIndex?: number;
    readonly blendMode?: GlobalCompositeOperation;
    readonly layoutDependencies?: ReadonlyArray<unknown>;
};

type MetricsState = {
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly visible: boolean;
};

const hasPositiveArea = (value: MetricsState): boolean =>
    value.width > 0 && value.height > 0;

const metricsEqual = (left: MetricsState, right: MetricsState): boolean =>
    left.width === right.width &&
    left.height === right.height &&
    left.dpr === right.dpr &&
    left.offsetX === right.offsetX &&
    left.offsetY === right.offsetY &&
    left.visible === right.visible;

const stabilizeMetrics = (
    current: MetricsState,
    candidate: MetricsState
): MetricsState => {
    if (metricsEqual(current, candidate)) {
        return current;
    }
    if (!candidate.visible) {
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[EffectRendererWithMetrics] metrics hidden', {
                reason: 'not-visible',
                width: candidate.width,
                height: candidate.height,
                offsetX: candidate.offsetX,
                offsetY: candidate.offsetY,
            });
        }
        return {
            ...candidate,
            width: 0,
            height: 0,
        } satisfies MetricsState;
    }
    if (
        !hasPositiveArea(candidate) &&
        current.visible &&
        hasPositiveArea(current)
    ) {
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[EffectRendererWithMetrics] metrics retained', {
                reason: 'zero-area-candidate',
                current,
                candidate,
            });
        }
        return current;
    }
    if (typeof console !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('[EffectRendererWithMetrics] metrics accepted', {
            candidate,
        });
    }
    return candidate;
};

const NO_LAYOUT_DEPS: ReadonlyArray<unknown> = [];

const useMetrics = (
    rootRef: React.RefObject<HTMLDivElement | null>,
    padding: number,
    sizing: 'container' | 'viewport',
    descriptorId: string,
    layoutDeps: ReadonlyArray<unknown>
) => {
    const [{ width, height, dpr, offsetX, offsetY, visible }, setMetrics] =
        useState<MetricsState>({
            width: 0,
            height: 0,
            dpr: 1,
            offsetX: 0,
            offsetY: 0,
            visible: true,
        });
    const intersectionVisibleRef = useRef(true);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return undefined;
        }
        const target = rootRef.current;
        if (!target) {
            return undefined;
        }
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            const intersecting = Boolean(
                entry?.isIntersecting && entry.intersectionRatio > 0
            );
            if (intersectionVisibleRef.current === intersecting) {
                return;
            }
            intersectionVisibleRef.current = intersecting;
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[EffectRendererWithMetrics] intersection change', {
                    intersecting,
                    descriptorId,
                });
            }
            setMetrics((current) =>
                stabilizeMetrics(current, {
                    ...current,
                    visible: intersecting,
                })
            );
        });
        observer.observe(target);
        return () => observer.disconnect();
    }, [descriptorId, rootRef, setMetrics]);
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
            const nextVisible =
                intersectionVisibleRef.current &&
                targetRect.width > 0 &&
                targetRect.height > 0 &&
                targetRect.bottom > 0 &&
                targetRect.right > 0 &&
                targetRect.left < window.innerWidth &&
                targetRect.top < window.innerHeight;
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
                    visible: nextVisible,
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
            const offsetLeft = rootRect.left;
            const offsetTop = rootRect.top;
            const nextVisible =
                intersectionVisibleRef.current &&
                rootRect.width > 0 &&
                rootRect.height > 0 &&
                rootRect.bottom > 0 &&
                rootRect.right > 0 &&
                rootRect.left < window.innerWidth &&
                rootRect.top < window.innerHeight;
            setMetrics((current) => {
                const next = stabilizeMetrics(current, {
                    width: contentWidth,
                    height: contentHeight,
                    dpr: pixelRatio,
                    offsetX: offsetLeft,
                    offsetY: offsetTop,
                    visible: nextVisible,
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
                        offsetX: next.offsetX,
                        offsetY: next.offsetY,
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
    }, [layoutDeps, padding, rootRef, sizing]);
    return useMemo(
        () => ({ width, height, dpr, offsetX, offsetY, visible }),
        [dpr, height, offsetX, offsetY, visible, width]
    );
};

export const EffectRendererWithMetrics = <
    State extends EngineState,
    UniformData,
>({
    padding = 0,
    borderRadius = 0,
    containerStyle,
    snapshotStyle,
    blendMode = 'source-over',
    zIndex = 0,
    groupId,
    groupZIndex,
    state,
    sizing = 'container',
    layoutDependencies,
    ...props
}: EffectRendererWithMetricsProps<
    State,
    UniformData
>): React.ReactElement | null => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [canvasVersion, setCanvasVersion] = useState(0);
    const { width, height, dpr, offsetX, offsetY, visible } = useMetrics(
        rootRef,
        padding,
        sizing,
        props.descriptor.id,
        layoutDependencies ?? NO_LAYOUT_DEPS
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
            {visible && width > 0 && height > 0 ? (
                <EffectRenderer
                    {...props}
                    state={mergedState}
                    blendMode={blendMode}
                    zIndex={zIndex}
                    groupId={groupId}
                    groupZIndex={groupZIndex}
                    snapshotStyle={snapshotStyle}
                    onFailure={(error) => {
                        setCanvasVersion((value) => value + 1);
                        props.onFailure?.(error);
                    }}
                    containerStyle={containerStyle}
                    layout={{ x: offsetX, y: offsetY, width, height, dpr }}
                />
            ) : null}
        </div>
    );
};
