import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import GlowShader from './glow.wgsl';
import {
    getGlowCssValues,
    WEBGPU_GLOW_OUTER_PAD_PX,
    GLOW_RIM_BOOST,
    GLOW_RIM_SPREAD,
    GLOW_RIM_WIDTH_SCALE,
    GLOW_NOISE_MIX,
    GLOW_INTENSITY_SCALE,
} from '../animation/glowSpec';
import { useAnimationTimeline } from '../animation/timeline';

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

declare global {
    interface Navigator {
        gpu?: GPU;
    }
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const UNIFORM_BUFFER_SIZE_BYTES = 256;

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const getStringProperty = (record: Record<string, unknown>, key: string) => {
    const value = record[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const getProperty = (record: Record<string, unknown>, key: string) =>
    Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

const safeJson = (value: unknown) => {
    try {
        const serialized = JSON.stringify(value);
        return typeof serialized === 'string' ? serialized : undefined;
    } catch {
        return undefined;
    }
};

const WGSL_VALUE_KEYS = [
    'default',
    'code',
    'source',
    'wgsl',
    'text',
    'data',
    'raw',
    'contents',
    'body',
    'File',
] as const;

const isArrayBufferView = (value: unknown): value is ArrayBufferView =>
    typeof value === 'object' && value !== null && ArrayBuffer.isView(value);

let cachedTextDecoder: TextDecoder | undefined;
const getTextDecoder = () => {
    if (cachedTextDecoder) {
        return cachedTextDecoder;
    }
    if (typeof TextDecoder === 'undefined') {
        return undefined;
    }
    cachedTextDecoder = new TextDecoder('utf8');
    return cachedTextDecoder;
};

const decodeBinaryModule = (
    value: ArrayBuffer | ArrayBufferView
): string | undefined => {
    const decoder = getTextDecoder();
    if (!decoder) {
        return undefined;
    }
    const view =
        value instanceof ArrayBuffer
            ? new Uint8Array(value)
            : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return decoder.decode(view);
};

const resolveNestedModule = (
    value: unknown,
    depth = 0,
    visited?: WeakSet<object>
): string | undefined => {
    if (depth > 5) {
        return undefined;
    }
    if (typeof value === 'string' && value.length > 0) {
        return value;
    }
    if (value instanceof ArrayBuffer) {
        return decodeBinaryModule(value);
    }
    if (isArrayBufferView(value)) {
        return decodeBinaryModule(value);
    }
    if (typeof value === 'function') {
        try {
            return resolveNestedModule(value(), depth + 1);
        } catch {
            return undefined;
        }
    }
    if (isRecord(value)) {
        const tracking = visited ?? new WeakSet<object>();
        if (tracking.has(value)) {
            return undefined;
        }
        tracking.add(value);
        const prioritized = WGSL_VALUE_KEYS.map((key) =>
            resolveNestedModule(value[key], depth + 1, tracking)
        ).find((result): result is string => result !== undefined);
        if (prioritized) {
            return prioritized;
        }
        const additionalKeys = Reflect.ownKeys(value)
            .filter((key): key is string => typeof key === 'string')
            .filter(
                (key) =>
                    !WGSL_VALUE_KEYS.includes(
                        key as (typeof WGSL_VALUE_KEYS)[number]
                    )
            )
            .filter((key) => !key.startsWith('_'))
            .filter((key) => key !== 'url');
        for (const key of additionalKeys) {
            const resolved = resolveNestedModule(
                value[key],
                depth + 1,
                tracking
            );
            if (resolved) {
                return resolved;
            }
        }
    }
    return undefined;
};

const normalizeRecordError = (record: Record<string, unknown>): Error => {
    const primaryMessage = [
        getStringProperty(record, 'message'),
        getStringProperty(record, 'reason'),
        getStringProperty(record, 'detail'),
        getStringProperty(record, 'description'),
    ].find((value) => value !== undefined);
    const fallbackMessage = safeJson(record) ?? '[object Object]';
    const error = new Error(primaryMessage ?? fallbackMessage);
    const inferredName = getStringProperty(record, 'name');
    if (inferredName) {
        error.name = inferredName;
    }
    const inferredStack = getStringProperty(record, 'stack');
    if (inferredStack) {
        error.stack = inferredStack;
    }
    if ('cause' in record) {
        (error as Error & { cause?: unknown }).cause = (
            record as {
                cause?: unknown;
            }
        ).cause;
    }
    return error;
};

const toError = (value: unknown): Error => {
    if (value instanceof Error) {
        return value;
    }
    if (typeof DOMException !== 'undefined' && value instanceof DOMException) {
        const message = `${value.name}: ${value.message}`;
        const error = new Error(message);
        error.name = value.name;
        error.stack = value.stack;
        return error;
    }
    if (isRecord(value)) {
        return normalizeRecordError(value);
    }
    return new Error(String(value));
};

const resolveWgslSource = (module: unknown): string => {
    const resolved = resolveNestedModule(module);
    if (resolved) {
        return resolved;
    }
    if (typeof module === 'object' && module !== null) {
        const defaultSource = (module as { default?: unknown }).default;
        const nested = resolveNestedModule(defaultSource);
        if (nested) {
            return nested;
        }
    }
    const metadata = isRecord(module)
        ? {
              keys: Object.keys(module),
              type: module.constructor?.name ?? typeof module,
          }
        : { type: typeof module };
    console.warn('[WebGPUGlow] Unexpected WGSL module shape', metadata);
    const fallback = String(module);
    console.warn('[WebGPUGlow] Falling back to stringified WGSL module', {
        fallback,
    });
    return fallback;
};

export const WebGPUGlow: React.FC<WebGPUGlowProps> = ({
    color,
    borderRadius = 0,
    focal = { x: 0.5, y: 0.4 },
    opacity = 1,
    animate = true,
    onFailure,
    onReady,
}) => {
    const timeline = useAnimationTimeline();
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
            const parentRect = el.parentElement?.getBoundingClientRect();
            const rect = parentRect ?? el.getBoundingClientRect();
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
            console.warn('[WebGPUGlow] WebGPU not supported; overlay disabled');
            onFailure?.(new Error('WebGPU not supported'));
            return undefined;
        }
        const { current: canvas } = canvasRef;
        if (!canvas || width <= 0 || height <= 0) return undefined;

        const { gpu } = navigator;
        if (!gpu) {
            failureNotifiedRef.current = true;
            readyNotifiedRef.current = false;
            setHasInitializationError(true);
            console.warn('[WebGPUGlow] navigator.gpu not available');
            onFailure?.(new Error('navigator.gpu not available'));
            return undefined;
        }

        let animationFrame = 0;
        let cancelled = false;
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
            device: GPUDevice,
            gpuContext: GPU
        ) => {
            const preferredFormat = gpuContext.getPreferredCanvasFormat();
            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.configure({
                device,
                format: preferredFormat,
                alphaMode: 'premultiplied',
            });
            return preferredFormat;
        };

        const writeUniforms = (
            device: GPUDevice,
            buffer: GPUBuffer,
            timeSeconds: number
        ) => {
            const glowValues = getGlowCssValues(timeSeconds);
            const currentOpacity = glowValues.opacity;
            const effectiveOpacity =
                opacity * GLOW_INTENSITY_SCALE * currentOpacity;
            const currentShadow = glowValues.shadowOpacity;
            const currentBrightness = glowValues.brightness;
            const uniforms = new Float32Array([
                timeSeconds,
                effectiveOpacity,
                width * dpr,
                height * dpr,
                borderRadius * dpr,
                WEBGPU_GLOW_OUTER_PAD_PX * dpr,
                currentShadow,
                currentBrightness,
                rgb.r / 255,
                rgb.g / 255,
                rgb.b / 255,
                GLOW_RIM_BOOST,
                normalizedFocal.x,
                normalizedFocal.y,
                GLOW_RIM_SPREAD * GLOW_RIM_WIDTH_SCALE * dpr,
                GLOW_NOISE_MIX,
            ]);
            device.queue.writeBuffer(buffer, 0, uniforms);
        };

        const renderFrame = (
            context: GPUCanvasContext,
            device: GPUDevice,
            pipeline: GPURenderPipeline,
            bindGroup: GPUBindGroup,
            uniformBuffer: GPUBuffer
        ) => {
            if (cancelled || failureNotifiedRef.current) {
                return;
            }
            const elapsed = animate ? timeline.getTimeSeconds() : 0;
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
                renderFrame(context, device, pipeline, bindGroup, uniformBuffer)
            );
        };

        const initialize = async (currentGpu: GPU) => {
            try {
                const adapter = await currentGpu.requestAdapter();
                if (!adapter) {
                    fail(new Error('WebGPU adapter unavailable'));
                    return;
                }
                const device = await adapter.requestDevice();
                if (cancelled) {
                    device.destroy?.();
                    return;
                }
                const onUncapturedError: EventListener = (event) => {
                    const maybeError = isRecord(event)
                        ? getProperty(event, 'error')
                        : undefined;
                    if (maybeError instanceof Error) {
                        fail(maybeError);
                        return;
                    }
                    const message =
                        typeof maybeError === 'string'
                            ? maybeError
                            : 'Uncaptured GPU error';
                    fail(new Error(message));
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
                            return null;
                        }
                        const message =
                            info.message ??
                            `WebGPU device lost (${info.reason ?? 'unknown'})`;
                        fail(new Error(message));
                        return null;
                    })
                    .catch((error) => {
                        fail(error);
                        return null;
                    });

                const context = canvas.getContext('webgpu');
                if (!context) {
                    fail(new Error('webgpu canvas context unavailable'));
                    return;
                }
                const format = configureCanvas(context, device, currentGpu);
                const shaderSource = resolveWgslSource(GlowShader);
                const shader = device.createShaderModule({
                    code: shaderSource,
                });
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
                    size: UNIFORM_BUFFER_SIZE_BYTES,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
                const bindGroup = device.createBindGroup({
                    layout: pipeline.getBindGroupLayout(0),
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: uniformBuffer,
                                size: UNIFORM_BUFFER_SIZE_BYTES,
                            },
                        },
                    ],
                });
                renderFrame(
                    context,
                    device,
                    pipeline,
                    bindGroup,
                    uniformBuffer
                );
            } catch (error) {
                fail(error);
            }
        };

        void initialize(gpu);

        return () => {
            cancelled = true;
            if (animationFrame) cancelAnimationFrame(animationFrame);
            detachUncapturedErrorListener?.();
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
        timeline,
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
