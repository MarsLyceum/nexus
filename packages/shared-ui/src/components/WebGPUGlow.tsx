import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
    clampFocal,
    createDefaultGlowBackends,
    createGlowRenderer,
    GlowBackendImplementation,
    GlowBackendId,
    GlowRendererControl,
} from './glowRenderer';
import { WEBGPU_GLOW_OUTER_PAD_PX } from '../animation/glowSpec';
import { useAnimationTimeline } from '../animation/timeline';

export type WebGPUGlowProps = {
    readonly color: string;
    readonly borderRadius?: number;
    readonly focal?: { readonly x: number; readonly y: number };
    readonly opacity?: number;
    readonly animate?: boolean;
    readonly preferredBackend?: GlowBackendId | 'auto';
    readonly onFailure?: (error: Error) => void;
    readonly onReady?: () => void;
    readonly backends?: ReadonlyArray<GlowBackendImplementation>;
};

const useMetrics = (rootRef: React.MutableRefObject<HTMLDivElement | null>) => {
    const [{ width, height, dpr }, setMetrics] = useState({
        width: 0,
        height: 0,
        dpr: 1,
    });
    useEffect(() => {
        if (Platform.OS !== 'web') {
            return undefined;
        }
        const root = rootRef.current;
        if (!root) {
            return undefined;
        }
        const compute = () => {
            const parentRect = root.parentElement?.getBoundingClientRect();
            const rect = parentRect ?? root.getBoundingClientRect();
            const pixelRatio =
                (globalThis as Window & typeof globalThis).devicePixelRatio ??
                1;
            setMetrics({
                width: rect.width + WEBGPU_GLOW_OUTER_PAD_PX * 2,
                height: rect.height + WEBGPU_GLOW_OUTER_PAD_PX * 2,
                dpr: pixelRatio,
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
    }, []);
    return useMemo(() => ({ width, height, dpr }), [dpr, height, width]);
};

export const WebGPUGlow: React.FC<WebGPUGlowProps> = ({
    color,
    borderRadius = 0,
    focal = { x: 0.5, y: 0.4 },
    opacity = 1,
    animate = true,
    preferredBackend = 'auto',
    onFailure,
    onReady,
    backends,
}) => {
    const timeline = useAnimationTimeline();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<GlowRendererControl | null>(null);
    const [backendId, setBackendId] = useState<GlowBackendId>('unknown');
    const [hasInitError, setHasInitError] = useState(false);
    const preferredBackendRef = useRef<GlowBackendId | 'auto'>(
        preferredBackend
    );
    const resolvedBackends = useMemo(
        () => (backends ? [...backends] : createDefaultGlowBackends()),
        [backends]
    );
    const { width, height, dpr } = useMetrics(rootRef);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return undefined;
        }
        const canvas = canvasRef.current;
        if (!canvas) {
            return undefined;
        }
        const renderer = createGlowRenderer({
            canvas,
            timeline,
            backends: resolvedBackends,
            onBackendChange: (next) => {
                setBackendId(next);
                setHasInitError(next === 'none');
            },
            onReady,
            onError: (error) => {
                setHasInitError(true);
                onFailure?.(error);
            },
        });
        rendererRef.current = renderer;
        renderer.update({
            color,
            borderRadius,
            focal: clampFocal(focal),
            opacity,
            animate,
            width,
            height,
            dpr,
        });
        void renderer.setDesiredBackend(preferredBackendRef.current);
        renderer.start();
        return () => {
            renderer.dispose();
            rendererRef.current = null;
        };
    }, [
        animate,
        borderRadius,
        color,
        dpr,
        focal,
        height,
        onFailure,
        onReady,
        opacity,
        resolvedBackends,
        timeline,
        width,
    ]);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        rendererRef.current?.update({ width, height, dpr });
    }, [dpr, height, width]);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        rendererRef.current?.update({
            color,
            borderRadius,
            focal: clampFocal(focal),
            opacity,
            animate,
        });
    }, [animate, borderRadius, color, focal, opacity]);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        preferredBackendRef.current = preferredBackend;
        if (rendererRef.current) {
            void rendererRef.current.setDesiredBackend(preferredBackend);
        }
    }, [preferredBackend]);

    if (Platform.OS !== 'web') {
        return null;
    }

    if (backendId === 'none' || hasInitError) {
        return null;
    }

    return (
        <div
            ref={rootRef}
            style={{
                position: 'absolute',
                top: -WEBGPU_GLOW_OUTER_PAD_PX,
                right: -WEBGPU_GLOW_OUTER_PAD_PX,
                bottom: -WEBGPU_GLOW_OUTER_PAD_PX,
                left: -WEBGPU_GLOW_OUTER_PAD_PX,
                borderRadius,
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: backendId === 'unknown' ? 0 : 1,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    mixBlendMode: 'screen',
                }}
            />
        </div>
    );
};

export { hasWebGPU, hasWebGL } from './glowRenderer';
