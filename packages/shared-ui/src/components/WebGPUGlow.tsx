import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import GLOW_WGSL from './glow.wgsl';

type WebGPUGlowProps = {
    color: string;
    borderRadius?: number;
    /** 0-1 normalized focal point (x, y) for the light origin */
    focal?: { x: number; y: number };
    /** Opacity multiplier for the glow */
    opacity?: number;
    /** Whether to animate a subtle breathing pulse */
    animate?: boolean;
    onFailure?: (error: Error) => void;
    onReady?: () => void;
};

export const hasWebGPU = (): boolean =>
    typeof navigator !== 'undefined' && 'gpu' in navigator;

export const WEBGPU_GLOW_OUTER_PAD_PX = 144; // extend halo beyond container bounds similar to CSS box-shadow blur
const GLOW_RIM_BOOST = 3.2;
const GLOW_RIM_SPREAD = 42;
const GLOW_NOISE_MIX = 18;

declare global {
    interface Navigator {
        gpu?: GPU;
    }
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const parseRgb = (hex: string): { r: number; g: number; b: number } => {
    const normalized = hex.trim();
    if (/^#([0-9a-fA-F]{3})$/.test(normalized)) {
        const [, s] = /^#([0-9a-fA-F]{3})$/.exec(normalized)!;
        const r = Number.parseInt(s[0] + s[0], 16);
        const g = Number.parseInt(s[1] + s[1], 16);
        const b = Number.parseInt(s[2] + s[2], 16);
        return { r, g, b };
    }
    if (/^#([0-9a-fA-F]{6})$/.test(normalized)) {
        const [, s] = /^#([0-9a-fA-F]{6})$/.exec(normalized)!;
        return {
            r: Number.parseInt(s.slice(0, 2), 16),
            g: Number.parseInt(s.slice(2, 4), 16),
            b: Number.parseInt(s.slice(4, 6), 16),
        };
    }
    // Fallback to white
    return { r: 255, g: 255, b: 255 };
};

const toError = (value: unknown): Error =>
    value instanceof Error ? value : new Error(String(value));

export const WebGPUGlow: React.FC<WebGPUGlowProps> = ({
    color,
    borderRadius = 0,
    focal = { x: 0.5, y: 0.4 },
    opacity = 1,
    animate = true,
    onFailure,
    onReady,
}) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [{ width, height, dpr }, setMetrics] = useState({
        width: 0,
        height: 0,
        dpr: 1,
    });
    const [hasInitializationError, setHasInitializationError] = useState(false);
    const failureNotifiedRef = useRef(false);
    const readyNotifiedRef = useRef(false);

    const rgb = useMemo(() => parseRgb(color), [color]);
    const normalizedFocal = useMemo(
        () => ({
            x: clamp01(focal.x),
            y: clamp01(focal.y),
        }),
        [focal.x, focal.y]
    );

    useEffect(() => {
        if (Platform.OS !== 'web') return undefined;
        const el = rootRef.current;
        if (!el) return undefined;

        const compute = () => {
            const rect =
                el.parentElement?.getBoundingClientRect() ??
                el.getBoundingClientRect();
            const nextDpr = (globalThis as Window & typeof globalThis)
                .devicePixelRatio
                ? (globalThis as Window & typeof globalThis).devicePixelRatio
                : 1;
            setMetrics({
                width: rect.width + WEBGPU_GLOW_OUTER_PAD_PX * 2,
                height: rect.height + WEBGPU_GLOW_OUTER_PAD_PX * 2,
                dpr: nextDpr,
            });
        };
        compute();

        const RO = (
            globalThis as unknown as { ResizeObserver?: typeof ResizeObserver }
        ).ResizeObserver;
        if (RO) {
            const ro = new RO(compute);
            ro.observe(el);
            globalThis.addEventListener('resize', compute as EventListener);
            return () => {
                ro.disconnect();
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

    useEffect(() => {
        if (Platform.OS !== 'web') return undefined;
        if (!hasWebGPU()) {
            failureNotifiedRef.current = true;
            readyNotifiedRef.current = false;
            setHasInitializationError(true);
            // eslint-disable-next-line no-console
            console.warn('[WebGPUGlow] WebGPU not supported; overlay disabled');
            onFailure?.(new Error('WebGPU not supported'));
            return undefined;
        }
        const { current: canvas } = canvasRef;
        if (!canvas || width <= 0 || height <= 0) return undefined;

        const gpu = navigator.gpu;
        if (!gpu) {
            failureNotifiedRef.current = true;
            readyNotifiedRef.current = false;
            setHasInitializationError(true);
            // eslint-disable-next-line no-console
            console.warn('[WebGPUGlow] navigator.gpu not available');
            onFailure?.(new Error('navigator.gpu not available'));
            return undefined;
        }

        let animationFrame = 0;
        let cancelled = false;
        let activeDevice: GPUDevice | null = null;
        let detachUncapturedErrorListener: (() => void) | undefined;

        failureNotifiedRef.current = false;
        readyNotifiedRef.current = false;

        const fail = (reason: unknown) => {
            if (cancelled || failureNotifiedRef.current) {
                return;
            }
            failureNotifiedRef.current = true;
            const error = toError(reason);
            setHasInitializationError(true);
            readyNotifiedRef.current = false;
            // eslint-disable-next-line no-console
            console.error('[WebGPUGlow] Fallback to CSS glow due to:', error);
            onFailure?.(error);
        };

        const configureCanvas = (
            context: GPUCanvasContext,
            device: GPUDevice
        ) => {
            const format = navigator.gpu.getPreferredCanvasFormat();
            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.configure({ device, format, alphaMode: 'premultiplied' });
            return format;
        };

        const writeUniforms = (
            device: GPUDevice,
            buffer: GPUBuffer,
            timeSeconds: number
        ) => {
            const minI = 0.28;
            const maxI = 0.9;
            const uniforms = new Float32Array([
                timeSeconds,
                opacity,
                width * dpr,
                height * dpr,
                borderRadius,
                WEBGPU_GLOW_OUTER_PAD_PX * dpr,
                minI,
                maxI,
                rgb.r / 255,
                rgb.g / 255,
                rgb.b / 255,
                GLOW_RIM_BOOST,
                normalizedFocal.x,
                normalizedFocal.y,
                GLOW_RIM_SPREAD * dpr,
                GLOW_NOISE_MIX,
            ]);
            device.queue.writeBuffer(buffer, 0, uniforms.buffer);
        };

        const renderFrame = (
            context: GPUCanvasContext,
            device: GPUDevice,
            pipeline: GPURenderPipeline,
            bindGroup: GPUBindGroup,
            uniformBuffer: GPUBuffer,
            startTime: number
        ) => {
            if (cancelled || failureNotifiedRef.current) {
                return;
            }
            try {
                const now = performance.now();
                const elapsed = animate ? (now - startTime) / 1000 : 0;
                writeUniforms(device, uniformBuffer, elapsed);
                const textureView = context.getCurrentTexture().createView();
                const encoder = device.createCommandEncoder();
                const pass = encoder.beginRenderPass({
                    colorAttachments: [
                        {
                            view: textureView,
                            loadOp: 'clear',
                            clearValue: { r: 0, g: 0, b: 0, a: 0 },
                            storeOp: 'store',
                        },
                    ],
                });
                pass.setPipeline(pipeline);
                pass.setBindGroup(0, bindGroup);
                pass.draw(6, 1, 0, 0);
                pass.end();
                device.queue.submit([encoder.finish()]);
                if (!readyNotifiedRef.current) {
                    readyNotifiedRef.current = true;
                    onReady?.();
                }
                animationFrame = requestAnimationFrame(() =>
                    renderFrame(
                        context,
                        device,
                        pipeline,
                        bindGroup,
                        uniformBuffer,
                        startTime
                    )
                );
            } catch (cause) {
                fail(cause);
            }
        };

        const initialize = async () => {
            try {
                const adapter = await gpu.requestAdapter();
                if (!adapter) {
                    fail(new Error('WebGPU adapter unavailable'));
                    return;
                }
                const device = await adapter.requestDevice();
                if (cancelled) {
                    device.destroy?.();
                    return;
                }
                activeDevice = device;
                const onUncapturedError = (event: GPUUncapturedErrorEvent) => {
                    fail(event.error ?? new Error('Uncaptured GPU error'));
                };
                device.addEventListener('uncapturederror', onUncapturedError);
                detachUncapturedErrorListener = () => {
                    device.removeEventListener(
                        'uncapturederror',
                        onUncapturedError
                    );
                };
                void device.lost
                    .then((info) => {
                        if (info.reason === 'destroyed' || cancelled) {
                            return;
                        }
                        fail(
                            new Error(
                                info.message ??
                                    `WebGPU device lost (${info.reason ?? 'unknown'})`
                            )
                        );
                    })
                    .catch(fail);

                const context = canvas.getContext('webgpu');
                if (!context) {
                    fail(new Error('webgpu canvas context unavailable'));
                    return;
                }
                const format = configureCanvas(context, device);
                const shader = device.createShaderModule({ code: GLOW_WGSL });
                const pipeline = device.createRenderPipeline({
                    layout: 'auto',
                    vertex: { module: shader, entryPoint: 'vs' },
                    fragment: {
                        module: shader,
                        entryPoint: 'fs',
                        targets: [
                            {
                                format,
                                blend: {
                                    color: {
                                        srcFactor: 'one',
                                        dstFactor: 'one-minus-src-alpha',
                                        operation: 'add',
                                    },
                                    alpha: {
                                        srcFactor: 'one',
                                        dstFactor: 'one-minus-src-alpha',
                                        operation: 'add',
                                    },
                                },
                            },
                        ],
                    },
                    primitive: { topology: 'triangle-list' },
                });

                const uniformBuffer = device.createBuffer({
                    size: 64,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
                const bindGroup = device.createBindGroup({
                    layout: pipeline.getBindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: { buffer: uniformBuffer } },
                    ],
                });
                const startTime = performance.now();
                renderFrame(
                    context,
                    device,
                    pipeline,
                    bindGroup,
                    uniformBuffer,
                    startTime
                );
            } catch (cause) {
                fail(cause);
            }
        };

        void initialize();

        return () => {
            cancelled = true;
            if (animationFrame) cancelAnimationFrame(animationFrame);
            detachUncapturedErrorListener?.();
            activeDevice = null;
            readyNotifiedRef.current = false;
        };
    }, [
        width,
        height,
        dpr,
        rgb,
        normalizedFocal.x,
        normalizedFocal.y,
        opacity,
        animate,
        borderRadius,
        hasInitializationError,
        onFailure,
        onReady,
    ]);

    if (Platform.OS !== 'web') {
        return null;
    }

    if (!hasWebGPU() || hasInitializationError) {
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
