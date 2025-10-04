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

export type GlowBackendId = 'unknown' | 'webgpu' | 'webgl' | 'none';

type GlowRgb = { r: number; g: number; b: number };

export type GlowRendererMetrics = {
    width: number;
    height: number;
    dpr: number;
};

export type GlowRendererState = {
    width: number;
    height: number;
    dpr: number;
    borderRadius: number;
    opacity: number;
    color: string;
    focal: { x: number; y: number };
    animate: boolean;
};

type GlowUniformInput = {
    timeSeconds: number;
    opacity: number;
    width: number;
    height: number;
    dpr: number;
    borderRadius: number;
    rgb: GlowRgb;
    focal: { x: number; y: number };
};

type GlowUniformState = {
    timeSeconds: number;
    effectiveOpacity: number;
    widthPx: number;
    heightPx: number;
    radiusPx: number;
    padPx: number;
    shadowOpacity: number;
    brightness: number;
    color: GlowRgb;
    rimBoost: number;
    focal: { x: number; y: number };
    rimSpreadPx: number;
    noiseMix: number;
};

type GlowBackendRenderInput = {
    metrics: GlowRendererMetrics;
    uniformState: GlowUniformState;
};

export type GlowBackendHandle = {
    id: GlowBackendId;
    renderFrame: (input: GlowBackendRenderInput) => void;
    destroy: () => void;
};

export type GlowBackendContext = {
    canvas: HTMLCanvasElement;
    metrics: GlowRendererMetrics;
    onFatal: (error: Error) => void;
};

export type GlowBackendImplementation = {
    id: GlowBackendId;
    isAvailable: () => boolean | Promise<boolean>;
    create: (context: GlowBackendContext) => Promise<GlowBackendHandle>;
};

type GlowRendererOptions = {
    canvas: HTMLCanvasElement;
    timeline: { getTimeSeconds: () => number };
    backends?: GlowBackendImplementation[];
    onBackendChange?: (backend: GlowBackendId) => void;
    onReady?: () => void;
    onError?: (error: Error) => void;
};

export type GlowRendererControl = {
    update: (state: Partial<GlowRendererState>) => void;
    start: () => void;
    stop: () => void;
    dispose: () => void;
    setDesiredBackend: (
        backend: GlowBackendId | 'auto'
    ) => Promise<GlowBackendId>;
    getActiveBackend: () => GlowBackendId;
};

const DEFAULT_STATE: GlowRendererState = {
    width: 0,
    height: 0,
    dpr: 1,
    borderRadius: 0,
    opacity: 1,
    color: '#ffffff',
    focal: { x: 0.5, y: 0.5 },
    animate: true,
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const parseRgb = (hex: string): GlowRgb => {
    const normalized = hex.trim();
    if (/^#([0-9a-fA-F]{3})$/.test(normalized)) {
        const [, short] = /^#([0-9a-fA-F]{3})$/.exec(normalized)!;
        return {
            r: Number.parseInt(short[0] + short[0], 16),
            g: Number.parseInt(short[1] + short[1], 16),
            b: Number.parseInt(short[2] + short[2], 16),
        };
    }
    if (/^#([0-9a-fA-F]{6})$/.test(normalized)) {
        const [, full] = /^#([0-9a-fA-F]{6})$/.exec(normalized)!;
        return {
            r: Number.parseInt(full.slice(0, 2), 16),
            g: Number.parseInt(full.slice(2, 4), 16),
            b: Number.parseInt(full.slice(4, 6), 16),
        };
    }
    return { r: 255, g: 255, b: 255 };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const getStringProperty = (record: Record<string, unknown>, key: string) => {
    const value = record[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};

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
        return additionalKeys
            .map((key) => resolveNestedModule(value[key], depth + 1, tracking))
            .find((result): result is string => result !== undefined);
    }
    return undefined;
};

const normalizeRecordError = (record: Record<string, unknown>): Error => {
    const primaryMessage = [
        getStringProperty(record, 'message'),
        getStringProperty(record, 'reason'),
        getStringProperty(record, 'detail'),
        getStringProperty(record, 'description'),
    ].find((candidate) => candidate !== undefined);
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

export const toError = (value: unknown): Error => {
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
    // eslint-disable-next-line no-console
    console.warn('[GlowRenderer] Unexpected WGSL module shape', metadata);
    const fallback = String(module);
    // eslint-disable-next-line no-console
    console.warn('[GlowRenderer] Falling back to stringified WGSL module', {
        fallback,
    });
    return fallback;
};

const computeGlowUniformState = (input: GlowUniformInput): GlowUniformState => {
    const glowValues = getGlowCssValues(input.timeSeconds);
    const effectiveOpacity =
        input.opacity * GLOW_INTENSITY_SCALE * glowValues.opacity;
    const widthPx = input.width * input.dpr;
    const heightPx = input.height * input.dpr;
    const radiusPx = input.borderRadius * input.dpr;
    const padPx = WEBGPU_GLOW_OUTER_PAD_PX * input.dpr;
    return {
        timeSeconds: input.timeSeconds,
        effectiveOpacity,
        widthPx,
        heightPx,
        radiusPx,
        padPx,
        shadowOpacity: glowValues.shadowOpacity,
        brightness: glowValues.brightness,
        color: {
            r: input.rgb.r / 255,
            g: input.rgb.g / 255,
            b: input.rgb.b / 255,
        },
        rimBoost: GLOW_RIM_BOOST,
        focal: input.focal,
        rimSpreadPx: GLOW_RIM_SPREAD * GLOW_RIM_WIDTH_SCALE * input.dpr,
        noiseMix: GLOW_NOISE_MIX,
    };
};

const glowStateToFloatArray = (state: GlowUniformState): Float32Array =>
    new Float32Array([
        state.timeSeconds,
        state.effectiveOpacity,
        state.widthPx,
        state.heightPx,
        state.radiusPx,
        state.padPx,
        state.shadowOpacity,
        state.brightness,
        state.color.r,
        state.color.g,
        state.color.b,
        state.rimBoost,
        state.focal.x,
        state.focal.y,
        state.rimSpreadPx,
        state.noiseMix,
    ]);

const setCanvasDimensions = (
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    dpr: number
) => {
    const pixelWidth = Math.max(1, Math.floor(width * dpr));
    const pixelHeight = Math.max(1, Math.floor(height * dpr));
    if (canvas.width !== pixelWidth) {
        canvas.width = pixelWidth;
    }
    if (canvas.height !== pixelHeight) {
        canvas.height = pixelHeight;
    }
    const widthStyle = `${width}px`;
    const heightStyle = `${height}px`;
    if (canvas.style.width !== widthStyle) {
        canvas.style.width = widthStyle;
    }
    if (canvas.style.height !== heightStyle) {
        canvas.style.height = heightStyle;
    }
};

const WEBGL_VERTEX_SHADER_SOURCE = `
attribute vec2 position;
varying vec2 vUv;

void main() {
    vUv = (position + 1.0) * 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const WEBGL_FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uOpacity;
uniform float uWidthPx;
uniform float uHeightPx;
uniform float uRadiusPx;
uniform float uPadPx;
uniform float uShadowOpacity;
uniform float uBrightness;
uniform vec3 uColor;
uniform float uRimBoost;
uniform vec2 uFocal;
uniform float uRimSpreadPx;
uniform float uNoiseMix;

float gaussian(float r, float sigma) {
    return exp(-0.5 * (r * r) / (sigma * sigma));
}

float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453);
}

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - (b - vec2(r, r));
    return length(max(q, vec2(0.0, 0.0))) - r;
}

void main() {
    vec2 p = (vUv - vec2(0.5, 0.5)) * vec2(uWidthPx, uHeightPx);
    vec2 halfSize = vec2(uWidthPx * 0.5 - uPadPx, uHeightPx * 0.5 - uPadPx);
    vec2 outerHalf = halfSize + vec2(uPadPx, uPadPx);

    float distanceFromEdge = sdRoundedRect(p, halfSize, uRadiusPx);
    if (distanceFromEdge < 0.0) {
        discard;
    }

    float t1 = gaussian(distanceFromEdge, 18.0);
    float t2 = gaussian(distanceFromEdge, 36.0);
    float t3 = gaussian(distanceFromEdge, 64.0);

    float intensity = uShadowOpacity;
    float softness = max(12.0, uPadPx * 0.35);
    float nearEdge = 1.0 - smoothstep(0.0, softness, distanceFromEdge);
    float outerDistance = sdRoundedRect(p, outerHalf, uRadiusPx + uPadPx);
    float outerMask = 1.0 - smoothstep(-softness, softness * 0.6, outerDistance);
    float distanceFalloff = exp(-distanceFromEdge / max(36.0, uPadPx * 0.9));
    float mask = saturate(nearEdge * outerMask * distanceFalloff);
    vec3 haloWeights = vec3(1.1, 0.7, 0.35);
    float halo = dot(haloWeights, vec3(t3, t2, t1)) / (haloWeights.x + haloWeights.y + haloWeights.z);
    float rim = pow(saturate(1.0 - distanceFromEdge / max(4.0, uRimSpreadPx)), uRimBoost);
    vec2 focusPx = (uFocal - vec2(0.5, 0.5)) * vec2(uWidthPx, uHeightPx);
    float focusWeight = saturate(exp(-length(p - focusPx) / (max(4.0, uRimSpreadPx) * 1.1)));
    float glow = intensity * mask * mix(halo, rim, focusWeight);

    float noiseAmplitude = uNoiseMix / 255.0;
    float noise = (hash(vUv * 1024.0 + vec2(uTime, uTime)) - 0.5) * noiseAmplitude;
    glow = max(0.0, glow + noise * saturate(glow * 8.0));

    float colorScale = glow * uOpacity;
    vec3 color = uColor * (colorScale * uBrightness);
    gl_FragColor = vec4(color, saturate(colorScale));
}
`;

type WebGLUniformLocations = {
    time: WebGLUniformLocation | null;
    opacity: WebGLUniformLocation | null;
    widthPx: WebGLUniformLocation | null;
    heightPx: WebGLUniformLocation | null;
    radiusPx: WebGLUniformLocation | null;
    padPx: WebGLUniformLocation | null;
    shadowOpacity: WebGLUniformLocation | null;
    brightness: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    rimBoost: WebGLUniformLocation | null;
    focal: WebGLUniformLocation | null;
    rimSpreadPx: WebGLUniformLocation | null;
    noiseMix: WebGLUniformLocation | null;
};

const compileShader = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    type: number,
    source: string
) => {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Unable to create shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        const info = gl.getShaderInfoLog(shader) ?? 'Shader compilation failed';
        gl.deleteShader(shader);
        throw new Error(info);
    }
    return shader;
};

const createProgram = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string
) => {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentSource
    );
    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error('Unable to create program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
        const info = gl.getProgramInfoLog(program) ?? 'Program linking failed';
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error(info);
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
};

const initFullscreenQuad = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram
) => {
    const buffer = gl.createBuffer();
    if (!buffer) {
        throw new Error('Unable to create buffer');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, 'position');
    if (location === -1) {
        throw new Error('Missing position attribute');
    }
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    return buffer;
};

const getUniformLocations = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram
): WebGLUniformLocations => ({
    time: gl.getUniformLocation(program, 'uTime'),
    opacity: gl.getUniformLocation(program, 'uOpacity'),
    widthPx: gl.getUniformLocation(program, 'uWidthPx'),
    heightPx: gl.getUniformLocation(program, 'uHeightPx'),
    radiusPx: gl.getUniformLocation(program, 'uRadiusPx'),
    padPx: gl.getUniformLocation(program, 'uPadPx'),
    shadowOpacity: gl.getUniformLocation(program, 'uShadowOpacity'),
    brightness: gl.getUniformLocation(program, 'uBrightness'),
    color: gl.getUniformLocation(program, 'uColor'),
    rimBoost: gl.getUniformLocation(program, 'uRimBoost'),
    focal: gl.getUniformLocation(program, 'uFocal'),
    rimSpreadPx: gl.getUniformLocation(program, 'uRimSpreadPx'),
    noiseMix: gl.getUniformLocation(program, 'uNoiseMix'),
});

const uploadUniformState = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    locations: WebGLUniformLocations,
    state: GlowUniformState
) => {
    if (locations.time) gl.uniform1f(locations.time, state.timeSeconds);
    if (locations.opacity)
        gl.uniform1f(locations.opacity, state.effectiveOpacity);
    if (locations.widthPx) gl.uniform1f(locations.widthPx, state.widthPx);
    if (locations.heightPx) gl.uniform1f(locations.heightPx, state.heightPx);
    if (locations.radiusPx) gl.uniform1f(locations.radiusPx, state.radiusPx);
    if (locations.padPx) gl.uniform1f(locations.padPx, state.padPx);
    if (locations.shadowOpacity)
        gl.uniform1f(locations.shadowOpacity, state.shadowOpacity);
    if (locations.brightness)
        gl.uniform1f(locations.brightness, state.brightness);
    if (locations.color)
        gl.uniform3f(
            locations.color,
            state.color.r,
            state.color.g,
            state.color.b
        );
    if (locations.rimBoost) gl.uniform1f(locations.rimBoost, state.rimBoost);
    if (locations.focal)
        gl.uniform2f(locations.focal, state.focal.x, state.focal.y);
    if (locations.rimSpreadPx)
        gl.uniform1f(locations.rimSpreadPx, state.rimSpreadPx);
    if (locations.noiseMix) gl.uniform1f(locations.noiseMix, state.noiseMix);
};

let cachedWebglAvailability: boolean | undefined;

export const hasWebGL = (): boolean => {
    if (cachedWebglAvailability !== undefined) {
        return cachedWebglAvailability;
    }
    if (typeof document === 'undefined') {
        cachedWebglAvailability = false;
        return cachedWebglAvailability;
    }
    const canvas = document.createElement('canvas');
    const context =
        canvas.getContext('webgl2', { premultipliedAlpha: true }) ??
        canvas.getContext('webgl', { premultipliedAlpha: true });
    if (context && typeof context === 'object') {
        const loseContextExtension =
            context.getExtension?.('WEBGL_lose_context');
        if (loseContextExtension && typeof loseContextExtension === 'object') {
            const maybeLoseContext = Reflect.get(
                loseContextExtension,
                'loseContext'
            );
            if (typeof maybeLoseContext === 'function') {
                maybeLoseContext.call(loseContextExtension);
            }
        }
    }
    cachedWebglAvailability = context !== null;
    return cachedWebglAvailability;
};

export const hasWebGPU = (): boolean =>
    typeof navigator !== 'undefined' && 'gpu' in navigator;

const UNIFORM_BUFFER_SIZE_BYTES = 256;

const createWebGpuBackend = (): GlowBackendImplementation => ({
    id: 'webgpu',
    isAvailable: () => hasWebGPU(),
    create: async ({ canvas, metrics, onFatal }) => {
        const gpu = hasWebGPU() ? navigator.gpu : undefined;
        if (!gpu) {
            throw new Error('WebGPU unavailable');
        }
        const adapter = await gpu.requestAdapter();
        if (!adapter) {
            throw new Error('WebGPU adapter unavailable');
        }
        const device = await adapter.requestDevice();
        const context = canvas.getContext('webgpu');
        if (!context) {
            device.destroy?.();
            throw new Error('webgpu canvas context unavailable');
        }
        const format = gpu.getPreferredCanvasFormat();
        const configure = (nextMetrics: GlowRendererMetrics) => {
            setCanvasDimensions(
                canvas,
                nextMetrics.width,
                nextMetrics.height,
                nextMetrics.dpr
            );
            context.configure({
                device,
                format,
                alphaMode: 'premultiplied',
            });
        };
        configure(metrics);
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
        let lastMetrics = metrics;
        const detachUncapturedError = (() => {
            const handler = (event: GPUUncapturedErrorEvent) => {
                const interpreted =
                    event.error instanceof Error
                        ? event.error
                        : new Error('Uncaptured GPU error');
                onFatal(interpreted);
            };
            device.addEventListener('uncapturederror', handler);
            return () => {
                device.removeEventListener('uncapturederror', handler);
            };
        })();
        const deviceLost = device.lost.then((info) => {
            if (info.reason === 'destroyed') {
                return undefined;
            }
            const message =
                info.message ??
                `WebGPU device lost (${info.reason ?? 'unknown'})`;
            onFatal(new Error(message));
            return undefined;
        });
        const renderFrame = (input: GlowBackendRenderInput) => {
            if (
                input.metrics.width <= 0 ||
                input.metrics.height <= 0 ||
                input.metrics.dpr <= 0
            ) {
                return;
            }
            const changedMetrics =
                input.metrics.width !== lastMetrics.width ||
                input.metrics.height !== lastMetrics.height ||
                input.metrics.dpr !== lastMetrics.dpr;
            if (changedMetrics) {
                configure(input.metrics);
                lastMetrics = input.metrics;
            }
            device.queue.writeBuffer(
                uniformBuffer,
                0,
                glowStateToFloatArray(input.uniformState)
            );
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
        };
        const destroy = () => {
            detachUncapturedError();
            device.destroy?.();
            void deviceLost;
        };
        return { id: 'webgpu', renderFrame, destroy };
    },
});

const createWebGlBackend = (): GlowBackendImplementation => ({
    id: 'webgl',
    isAvailable: () => hasWebGL(),
    create: async ({ canvas, metrics, onFatal }) => {
        const gl =
            canvas.getContext('webgl2', {
                premultipliedAlpha: true,
                antialias: true,
            }) ??
            canvas.getContext('webgl', {
                premultipliedAlpha: true,
                antialias: true,
            });
        if (!gl) {
            throw new Error('WebGL context unavailable');
        }
        setCanvasDimensions(canvas, metrics.width, metrics.height, metrics.dpr);
        const program = createProgram(
            gl,
            WEBGL_VERTEX_SHADER_SOURCE,
            WEBGL_FRAGMENT_SHADER_SOURCE
        );
        gl.useProgram(program);
        const buffer = initFullscreenQuad(gl, program);
        const uniforms = getUniformLocations(gl, program);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, canvas.width, canvas.height);
        let lastMetrics = metrics;
        const renderFrame = (input: GlowBackendRenderInput) => {
            if (input.metrics.width <= 0 || input.metrics.height <= 0) {
                return;
            }
            const changedMetrics =
                input.metrics.width !== lastMetrics.width ||
                input.metrics.height !== lastMetrics.height ||
                input.metrics.dpr !== lastMetrics.dpr;
            if (changedMetrics) {
                setCanvasDimensions(
                    canvas,
                    input.metrics.width,
                    input.metrics.height,
                    input.metrics.dpr
                );
                gl.viewport(0, 0, canvas.width, canvas.height);
                lastMetrics = input.metrics;
            }
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            uploadUniformState(gl, uniforms, input.uniformState);
            try {
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            } catch (error) {
                onFatal(toError(error));
            }
        };
        const destroy = () => {
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
        };
        return { id: 'webgl', renderFrame, destroy };
    },
});

const deriveDefaultOrder = (
    backends: GlowBackendImplementation[]
): GlowBackendId[] =>
    backends
        .map((backend) => backend.id)
        .filter(
            (id, index, collection) =>
                ['webgpu', 'webgl'].includes(id) &&
                collection.indexOf(id) === index
        ) as GlowBackendId[];

const toMetrics = (state: GlowRendererState): GlowRendererMetrics => ({
    width: state.width,
    height: state.height,
    dpr: state.dpr,
});

export const createGlowRenderer = (
    options: GlowRendererOptions
): GlowRendererControl => {
    const availableBackends = options.backends ?? createDefaultGlowBackends();
    const backendMap = new Map(
        availableBackends.map((backend) => [backend.id, backend])
    );
    const defaultOrder = deriveDefaultOrder(availableBackends);
    let backendOrder = defaultOrder;
    let state = { ...DEFAULT_STATE };
    let activeHandle: GlowBackendHandle | undefined;
    let activeBackend: GlowBackendId = 'unknown';
    let running = false;
    let disposed = false;
    let frameId: number | undefined;
    let readyEmitted = false;

    const clearActiveHandle = () => {
        activeHandle?.destroy();
        activeHandle = undefined;
        if (activeBackend !== 'unknown') {
            activeBackend = 'unknown';
            options.onBackendChange?.('unknown');
        }
    };

    const handleFatal = (backendId: GlowBackendId, error: Error) => {
        if (disposed) {
            return;
        }
        if (activeBackend !== backendId) {
            options.onError?.(toError(error));
            return;
        }
        const normalized = toError(error);
        options.onError?.(normalized);
        clearActiveHandle();
        void ensureBackend([normalized]);
    };

    const ensureBackend = (
        initialErrors: ReadonlyArray<Error> = []
    ): Promise<GlowBackendId> => {
        if (disposed) {
            return Promise.resolve(activeBackend);
        }
        const desired = backendOrder[0];
        if (activeHandle && activeBackend === desired) {
            return Promise.resolve(activeBackend);
        }
        clearActiveHandle();
        const attemptOrder =
            backendOrder.length > 0
                ? backendOrder
                : (Array.from(backendMap.keys()) as GlowBackendId[]);
        type BackendAttemptState = {
            readonly handle: GlowBackendHandle | undefined;
            readonly backendId: GlowBackendId | undefined;
            readonly errors: ReadonlyArray<Error>;
        };
        const initialState: BackendAttemptState = {
            handle: undefined,
            backendId: undefined,
            errors: initialErrors,
        };
        return attemptOrder
            .reduce<Promise<BackendAttemptState>>(
                (promise, backendId) =>
                    promise.then((acc) => {
                        if (acc.handle) {
                            return acc;
                        }
                        const backend = backendMap.get(backendId);
                        if (!backend) {
                            return acc;
                        }
                        return Promise.resolve(backend.isAvailable())
                            .then((available) => {
                                if (!available) {
                                    return acc;
                                }
                                return backend
                                    .create({
                                        canvas: options.canvas,
                                        metrics: toMetrics(state),
                                        onFatal: (error) =>
                                            handleFatal(backendId, error),
                                    })
                                    .then((handle) => ({
                                        handle,
                                        backendId,
                                        errors: acc.errors,
                                    }))
                                    .catch((error) => {
                                        const normalized = toError(error);
                                        return {
                                            handle: undefined,
                                            backendId: undefined,
                                            errors: [...acc.errors, normalized],
                                        };
                                    });
                            })
                            .catch((error) => {
                                const normalized = toError(error);
                                return {
                                    handle: undefined,
                                    backendId: undefined,
                                    errors: [...acc.errors, normalized],
                                };
                            });
                    }),
                Promise.resolve(initialState)
            )
            .then((result) => {
                if (!result.handle || !result.backendId) {
                    activeBackend = 'none';
                    options.onBackendChange?.('none');
                    initialErrors.concat(result.errors).forEach((error) => {
                        options.onError?.(error);
                    });
                    return activeBackend;
                }
                activeHandle = result.handle;
                if (activeBackend !== result.backendId) {
                    activeBackend = result.backendId;
                    options.onBackendChange?.(result.backendId);
                    readyEmitted = false;
                }
                return activeBackend;
            });
    };

    const scheduleFrame = () => {
        if (disposed || !running) {
            return;
        }
        frameId = requestAnimationFrame(renderFrame);
    };

    const emitReadyOnce = () => {
        if (readyEmitted) {
            return;
        }
        readyEmitted = true;
        options.onReady?.();
    };

    const renderFrame = () => {
        if (disposed || !running) {
            return;
        }
        const handle = activeHandle;
        if (!handle) {
            scheduleFrame();
            return;
        }
        if (state.width <= 0 || state.height <= 0 || state.dpr <= 0) {
            scheduleFrame();
            return;
        }
        const uniformState = computeGlowUniformState({
            timeSeconds: state.animate ? options.timeline.getTimeSeconds() : 0,
            opacity: state.opacity,
            width: state.width,
            height: state.height,
            dpr: state.dpr,
            borderRadius: state.borderRadius,
            rgb: parseRgb(state.color),
            focal: {
                x: clamp01(state.focal.x),
                y: clamp01(state.focal.y),
            },
        });
        handle.renderFrame({
            metrics: toMetrics(state),
            uniformState,
        });
        emitReadyOnce();
        scheduleFrame();
    };

    const update = (partial: Partial<GlowRendererState>) => {
        state = { ...state, ...partial };
    };

    const start = () => {
        if (disposed || running) {
            return;
        }
        running = true;
        readyEmitted = false;
        void ensureBackend().then(() => {
            scheduleFrame();
        });
    };

    const stop = () => {
        if (!running) {
            return;
        }
        running = false;
        if (frameId) {
            cancelAnimationFrame(frameId);
            frameId = undefined;
        }
    };

    const dispose = () => {
        if (disposed) {
            return;
        }
        stop();
        disposed = true;
        clearActiveHandle();
    };

    const setDesiredBackend = (backend: GlowBackendId | 'auto') => {
        backendOrder =
            backend === 'auto'
                ? defaultOrder
                : [
                      backend,
                      ...defaultOrder.filter(
                          (candidate) => candidate !== backend
                      ),
                  ];
        readyEmitted = false;
        return ensureBackend();
    };

    const getActiveBackend = () => activeBackend;

    return {
        update,
        start,
        stop,
        dispose,
        setDesiredBackend,
        getActiveBackend,
    };
};

export const createDefaultGlowBackends = () => [
    createWebGpuBackend(),
    createWebGlBackend(),
];

export const clampFocal = (focal: { x: number; y: number }) => ({
    x: clamp01(focal.x),
    y: clamp01(focal.y),
});
