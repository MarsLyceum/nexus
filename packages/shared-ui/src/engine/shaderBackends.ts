/* eslint-disable no-param-reassign */
import {
    Backend,
    BackendContext,
    BackendHandle,
    RenderInput,
    RenderMetrics,
} from './types';
import {
    drawWebGpuFrame,
    drawWebglFrame,
    setCanvasDimensions,
    type ShaderUniformEncoder,
    type WebglUniformEncoder,
} from './shaderHelpers';
import { createWGSLDebug } from './wgslDebug';

export type WebGPUShaderConfig<UniformData> = {
    readonly shaderSource: string;
    readonly entryPoints?: {
        readonly vertex?: string;
        readonly fragment?: string;
    };
    readonly uniformEncoder: ShaderUniformEncoder<UniformData>;
    readonly debug?: {
        readonly enabled: boolean;
        readonly bindGroupIndex?: number;
        readonly invocationCapacity?: number;
    };
};

export type WebGLShaderConfig<UniformData> = {
    readonly vertexShaderSource: string;
    readonly fragmentShaderSource: string;
    readonly uniformEncoder: WebglUniformEncoder<UniformData>;
};

export type ShaderBackendConfig<UniformData> = {
    readonly webgpu?: WebGPUShaderConfig<UniformData>;
    readonly webgl?: WebGLShaderConfig<UniformData>;
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

const parseRadiusCandidate = (candidate: unknown): number | undefined => {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
    }
    if (typeof candidate === 'string') {
        const parsed = Number(candidate);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

const extractGlowRadius = (uniformData: unknown): number | undefined => {
    if (ArrayBuffer.isView(uniformData)) {
        const view = uniformData as unknown as ArrayLike<unknown>;
        if (view.length > 4) {
            return parseRadiusCandidate(view[4]);
        }
        return undefined;
    }
    if (typeof uniformData === 'object' && uniformData !== null) {
        const record = uniformData as Record<string, unknown>;
        return parseRadiusCandidate(record.radiusPx);
    }
    return undefined;
};

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

type GlowUniformParsed = {
    readonly timeSeconds?: number;
    readonly effectiveOpacity?: number;
    readonly widthPx?: number;
    readonly heightPx?: number;
    readonly radiusPx?: number;
    readonly padPx?: number;
    readonly shadowOpacity?: number;
    readonly brightness?: number;
    readonly rimBoost?: number;
    readonly rimSpreadPx?: number;
    readonly noiseMix?: number;
    readonly focalX?: number;
    readonly focalY?: number;
    readonly colorR?: number;
    readonly colorG?: number;
    readonly colorB?: number;
};

const parseGlowUniformArray = (
    view: ArrayLike<unknown>
): GlowUniformParsed | undefined => {
    if (view.length < 16) {
        return undefined;
    }
    const read = (index: number): number | undefined => {
        const candidate = view[index];
        return isFiniteNumber(candidate) ? candidate : undefined;
    };
    return {
        timeSeconds: read(0),
        effectiveOpacity: read(1),
        widthPx: read(2),
        heightPx: read(3),
        radiusPx: read(4),
        padPx: read(5),
        shadowOpacity: read(6),
        brightness: read(7),
        colorR: read(8),
        colorG: read(9),
        colorB: read(10),
        rimBoost: read(11),
        focalX: read(12),
        focalY: read(13),
        rimSpreadPx: read(14),
        noiseMix: read(15),
    };
};

const parseGlowUniformRecord = (
    record: Record<string, unknown>
): GlowUniformParsed => {
    const read = (key: string): number | undefined => {
        const candidate = record[key];
        return isFiniteNumber(candidate) ? candidate : undefined;
    };
    const focalCandidate = record.focal;
    const colorCandidate = record.color;
    const readNested = (
        candidate: unknown,
        key: 'x' | 'y'
    ): number | undefined => {
        if (typeof candidate !== 'object' || candidate === null) {
            return undefined;
        }
        const nested = candidate as Record<string, unknown>;
        const value = nested[key];
        return isFiniteNumber(value) ? value : undefined;
    };
    const readColor = (
        candidate: unknown,
        key: 'r' | 'g' | 'b'
    ): number | undefined => {
        if (typeof candidate !== 'object' || candidate === null) {
            return undefined;
        }
        const nested = candidate as Record<string, unknown>;
        const value = nested[key];
        return isFiniteNumber(value) ? value : undefined;
    };
    return {
        timeSeconds: read('timeSeconds'),
        effectiveOpacity: read('effectiveOpacity'),
        widthPx: read('widthPx'),
        heightPx: read('heightPx'),
        radiusPx: read('radiusPx'),
        padPx: read('padPx'),
        shadowOpacity: read('shadowOpacity'),
        brightness: read('brightness'),
        rimBoost: read('rimBoost'),
        rimSpreadPx: read('rimSpreadPx'),
        noiseMix: read('noiseMix'),
        focalX: readNested(focalCandidate, 'x'),
        focalY: readNested(focalCandidate, 'y'),
        colorR: readColor(colorCandidate, 'r'),
        colorG: readColor(colorCandidate, 'g'),
        colorB: readColor(colorCandidate, 'b'),
    };
};

const parseGlowUniformData = (
    uniformData: unknown
): GlowUniformParsed | undefined => {
    if (ArrayBuffer.isView(uniformData)) {
        return parseGlowUniformArray(uniformData as ArrayLike<unknown>);
    }
    if (typeof uniformData === 'object' && uniformData !== null) {
        return parseGlowUniformRecord(uniformData as Record<string, unknown>);
    }
    return undefined;
};

const formatGlowUniformSummary = (
    parsed: GlowUniformParsed
): string | undefined => {
    const formatNumber = (value: number) => value.toFixed(6);
    const entries: string[] = [];
    const append = (label: string, value: number | undefined) => {
        if (value === undefined) {
            return;
        }
        entries.push(`${label}=${formatNumber(value)}`);
    };
    append('uniformTimeSeconds', parsed.timeSeconds);
    append('uniformEffectiveOpacity', parsed.effectiveOpacity);
    append('uniformWidthPx', parsed.widthPx);
    append('uniformHeightPx', parsed.heightPx);
    append('uniformRadiusPx', parsed.radiusPx);
    append('uniformPadPx', parsed.padPx);
    append('uniformShadowOpacity', parsed.shadowOpacity);
    append('uniformBrightness', parsed.brightness);
    append('uniformRimBoost', parsed.rimBoost);
    append('uniformRimSpreadPx', parsed.rimSpreadPx);
    append('uniformNoiseMix', parsed.noiseMix);
    if (parsed.focalX !== undefined && parsed.focalY !== undefined) {
        entries.push(
            `uniformFocal=(${formatNumber(parsed.focalX)},${formatNumber(parsed.focalY)})`
        );
    }
    if (
        parsed.colorR !== undefined &&
        parsed.colorG !== undefined &&
        parsed.colorB !== undefined
    ) {
        entries.push(
            `uniformColor=(${formatNumber(parsed.colorR)},${formatNumber(
                parsed.colorG
            )},${formatNumber(parsed.colorB)})`
        );
    }
    if (entries.length === 0) {
        return undefined;
    }
    return entries.join(' ');
};

type GlowDebugSnapshot = {
    readonly radiusPx?: number;
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
    readonly actualPixelWidth?: number;
    readonly actualPixelHeight?: number;
    readonly frame?: number;
    readonly uniformSummarySignature?: string;
    readonly shadowOpacity?: number;
    readonly timeSeconds?: number;
};

type GlowDebugInput = {
    readonly uniformData: unknown;
    readonly metrics: RenderMetrics;
    readonly actualPixelWidth?: number;
    readonly actualPixelHeight?: number;
    readonly frame?: number;
};

type GlowDebugSample = {
    readonly snapshot: GlowDebugSnapshot;
    readonly shadowOpacity?: number;
    readonly timeSeconds?: number;
};

const createGlowDebugLogger = (label: string) => {
    let hasLogged = false;
    let previousSample: GlowDebugSample | undefined;
    let previousSlope: number | undefined;

    const logSnapshot = (snapshot: GlowDebugSnapshot) => {
        const frameLabel =
            snapshot.frame !== undefined ? ` frame=${snapshot.frame}` : '';
        const radiusDisplay =
            snapshot.radiusPx !== undefined
                ? `radiusPx=${snapshot.radiusPx.toFixed(6)}`
                : 'radiusPx=unknown';
        const pixelWidth = Math.max(
            1,
            Math.floor(snapshot.width * snapshot.dpr)
        );
        const pixelHeight = Math.max(
            1,
            Math.floor(snapshot.height * snapshot.dpr)
        );
        const actualWidthDisplay =
            snapshot.actualPixelWidth !== undefined
                ? ` actualPixelWidth=${snapshot.actualPixelWidth}`
                : '';
        const actualHeightDisplay =
            snapshot.actualPixelHeight !== undefined
                ? ` actualPixelHeight=${snapshot.actualPixelHeight}`
                : '';
        const uniformDisplay = snapshot.uniformSummarySignature
            ? ` ${snapshot.uniformSummarySignature}`
            : '';
        console.log(
            `[Glow][${label}]${frameLabel} ${radiusDisplay} width=${snapshot.width.toFixed(
                6
            )} height=${snapshot.height.toFixed(6)} dpr=${snapshot.dpr.toFixed(
                6
            )} pixelWidth=${pixelWidth} pixelHeight=${pixelHeight}${actualWidthDisplay}${actualHeightDisplay}${uniformDisplay}`
        );
    };

    return (input: GlowDebugInput) => {
        if (hasLogged) {
            return;
        }
        const parsedUniforms = parseGlowUniformData(input.uniformData);
        if (!parsedUniforms) {
            previousSample = undefined;
            previousSlope = undefined;
            return;
        }
        const radiusPx = extractGlowRadius(input.uniformData);
        const snapshot: GlowDebugSnapshot = {
            radiusPx,
            width: input.metrics.width,
            height: input.metrics.height,
            dpr: input.metrics.dpr,
            actualPixelWidth: input.actualPixelWidth,
            actualPixelHeight: input.actualPixelHeight,
            frame: input.frame,
            uniformSummarySignature: formatGlowUniformSummary(parsedUniforms),
            shadowOpacity: parsedUniforms.shadowOpacity,
            timeSeconds: parsedUniforms.timeSeconds,
        };
        const sample: GlowDebugSample = {
            snapshot,
            shadowOpacity: parsedUniforms.shadowOpacity,
            timeSeconds: parsedUniforms.timeSeconds,
        };

        if (!previousSample) {
            previousSample = sample;
            previousSlope = undefined;
            return;
        }

        const currentTime = sample.timeSeconds;
        const previousTime = previousSample.timeSeconds;
        const currentShadow = sample.shadowOpacity;
        const previousShadow = previousSample.shadowOpacity;

        if (
            currentTime === undefined ||
            previousTime === undefined ||
            currentShadow === undefined ||
            previousShadow === undefined
        ) {
            previousSample = sample;
            previousSlope = undefined;
            return;
        }

        const deltaTime = currentTime - previousTime;
        if (deltaTime <= 0) {
            previousSample = sample;
            previousSlope = undefined;
            return;
        }

        const slope = (currentShadow - previousShadow) / deltaTime;
        if (previousSlope !== undefined && previousSlope > 0 && slope <= 0) {
            const peakSample =
                currentShadow >= previousShadow ? sample : previousSample;
            logSnapshot(peakSample.snapshot);
            hasLogged = true;
            return;
        }

        previousSample = sample;
        previousSlope = slope;
    };
};

const createFrameCounter = () => {
    let count = 0;
    return () => {
        count += 1;
        return count;
    };
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
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, 'position');
    if (location === -1) {
        throw new Error('Missing position attribute');
    }
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    return buffer;
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

export const createWebGPUShaderBackend = <UniformData>(
    config: WebGPUShaderConfig<UniformData>
): Backend<UniformData> => ({
    id: 'webgpu',
    isAvailable: () => hasWebGPU(),
    create: async ({
        canvas,
        metrics,
        onFatal,
    }: BackendContext): Promise<BackendHandle<UniformData>> => {
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
        const logGlowState = createGlowDebugLogger('WebGPU');
        const nextFrameId = createFrameCounter();
        const format = gpu.getPreferredCanvasFormat();
        const configureContext = (pixelWidth: number, pixelHeight: number) => {
            context.configure({
                device,
                format,
                alphaMode: 'premultiplied',
                colorSpace: 'srgb',
            });
            configuredPixelWidth = pixelWidth;
            configuredPixelHeight = pixelHeight;
        };
        let configuredPixelWidth = 0;
        let configuredPixelHeight = 0;
        const configureSurface = (nextMetrics: RenderMetrics) => {
            setCanvasDimensions({ canvas, metrics: nextMetrics });
            const pixelWidth = canvas.width;
            const pixelHeight = canvas.height;
            if (
                pixelWidth === configuredPixelWidth &&
                pixelHeight === configuredPixelHeight
            ) {
                return;
            }
            configureContext(pixelWidth, pixelHeight);
        };
        configureSurface(metrics);
        canvas.addEventListener('webgpucontextlost', (event) => {
            event.preventDefault();
            onFatal(new Error('WebGPU context lost'));
        });
        const vertexEntryPoint = config.entryPoints?.vertex ?? 'main';
        const fragmentEntryPoint = config.entryPoints?.fragment ?? 'main';

        const debugConfig = config.debug ?? { enabled: false };
        const debug = debugConfig.enabled
            ? createWGSLDebug(debugConfig.bindGroupIndex ?? 1)
            : undefined;
        if (debug && !debug.isActive()) {
            await debug.setup(device, debugConfig.invocationCapacity ?? 4096);
        }
        const instrumentedShaderSource = debug
            ? debug.addShader(config.shaderSource, true)
            : config.shaderSource;

        const vertexModule = device.createShaderModule({
            code: instrumentedShaderSource,
            label: 'shader-vertex-module',
        });
        const fragmentModule = device.createShaderModule({
            code: instrumentedShaderSource,
            label: 'shader-fragment-module',
        });

        type GPUShaderModuleWithLegacy = GPUShaderModule & {
            readonly getCompilationInfo?: () => Promise<GPUCompilationInfo>;
        };

        const loadCompilationInfo = async (
            module: GPUShaderModuleWithLegacy
        ): Promise<GPUCompilationInfo | undefined> => {
            if (typeof module.compilationInfo === 'function') {
                return module.compilationInfo();
            }
            if (typeof module.getCompilationInfo === 'function') {
                return module.getCompilationInfo();
            }
            console.warn(
                '[WebGPU] Shader compilation diagnostics unavailable on this browser'
            );
            return undefined;
        };

        const reportShaderCompilation = async (
            module: GPUShaderModule,
            stage: 'vertex' | 'fragment'
        ): Promise<string[]> => {
            const info = await loadCompilationInfo(module);
            const messages = (info?.messages ?? []).filter(
                (message) => message.type !== 'info'
            );
            if (messages.length === 0) {
                return [];
            }
            const formatted = messages.map((message) => {
                const hasLocation =
                    typeof message.lineNum === 'number' &&
                    typeof message.linePos === 'number';
                const location = hasLocation
                    ? ` (${message.lineNum}:${message.linePos})`
                    : '';
                return `[${stage}] ${message.type}${location}: ${message.message}`;
            });
            console.error(
                `[WebGPU] Shader compilation messages:\n${formatted.join('\n')}`
            );
            return formatted;
        };

        let pipeline: GPURenderPipeline;
        try {
            pipeline = await device.createRenderPipelineAsync({
                layout: 'auto',
                vertex: {
                    module: vertexModule,
                    entryPoint: vertexEntryPoint,
                },
                fragment: {
                    module: fragmentModule,
                    entryPoint: fragmentEntryPoint,
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
                primitive: {
                    topology: 'triangle-strip',
                    stripIndexFormat: undefined,
                },
            });
        } catch (error) {
            const details = await Promise.all([
                reportShaderCompilation(vertexModule, 'vertex'),
                reportShaderCompilation(fragmentModule, 'fragment'),
            ]);
            const flattenedDetails = details.flat();
            if (error instanceof Error && flattenedDetails.length > 0) {
                error.message = `${error.message}\n${flattenedDetails.join('\n')}`;
                (
                    error as Error & {
                        shaderDiagnostics?: ReadonlyArray<string>;
                    }
                ).shaderDiagnostics = flattenedDetails;
            }
            console.error('[WebGPU] Failed to create render pipeline', error);
            throw error;
        }
        const { uniformEncoder } = config;
        const uniformBuffer = device.createBuffer({
            size: uniformEncoder.uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const bindGroupLayout = pipeline.getBindGroupLayout(0);
        const bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: uniformBuffer,
                    },
                },
            ],
        });
        const drawFrame = (renderInput: RenderInput<UniformData>) => {
            configureSurface(renderInput.metrics);
            drawWebGpuFrame({
                device,
                pipeline,
                uniformBuffer,
                bindGroup,
                context,
                uniformEncoder,
                renderInput,
                debug: debug
                    ? {
                          configurePass: (passEncoder) => {
                              debug.setBindGroup(pipeline, passEncoder);
                          },
                          afterPass: (commandEncoder) => {
                              debug.fetch(commandEncoder);
                          },
                          afterSubmit: () => {
                              void debug.post();
                          },
                      }
                    : undefined,
            });
            const htmlCanvas =
                typeof HTMLCanvasElement !== 'undefined' &&
                canvas instanceof HTMLCanvasElement
                    ? canvas
                    : undefined;
            logGlowState({
                uniformData: renderInput.uniformData,
                metrics: renderInput.metrics,
                actualPixelWidth: htmlCanvas?.width,
                actualPixelHeight: htmlCanvas?.height,
                frame: nextFrameId(),
            });
        };
        return {
            id: 'webgpu',
            renderFrame: drawFrame,
            destroy: () => {
                uniformBuffer.destroy();
                device.destroy?.();
                if (debug?.buf) {
                    debug.buf.destroy();
                }
                if (debug?.readbackBuf) {
                    debug.readbackBuf.destroy();
                }
            },
        };
    },
});

export const createWebGLShaderBackend = <UniformData>(
    config: WebGLShaderConfig<UniformData>
): Backend<UniformData> => ({
    id: 'webgl',
    isAvailable: () => hasWebGL(),
    // eslint-disable-next-line @typescript-eslint/require-await
    create: async ({
        canvas,
        metrics,
        onFatal,
    }: BackendContext): Promise<BackendHandle<UniformData>> => {
        const context = canvas.getContext('webgl2', {
            preserveDrawingBuffer: true,
        });
        const gl =
            context ??
            canvas.getContext('webgl', {
                preserveDrawingBuffer: true,
            });
        if (!gl) {
            throw new Error('webgl context unavailable');
        }
        setCanvasDimensions({ canvas, metrics });
        const program = createProgram(
            gl,
            config.vertexShaderSource,
            config.fragmentShaderSource
        );
        const buffer = initFullscreenQuad(gl, program);
        const logGlowState = createGlowDebugLogger('WebGL');
        const nextFrameId = createFrameCounter();
        const drawFrame = (renderInput: RenderInput<UniformData>) => {
            drawWebglFrame({
                gl,
                program,
                buffer,
                uniformEncoder: config.uniformEncoder,
                renderInput,
            });
            const targetCanvas =
                typeof HTMLCanvasElement !== 'undefined' &&
                gl.canvas instanceof HTMLCanvasElement
                    ? gl.canvas
                    : undefined;
            logGlowState({
                uniformData: renderInput.uniformData,
                metrics: renderInput.metrics,
                actualPixelWidth: targetCanvas?.width,
                actualPixelHeight: targetCanvas?.height,
                frame: nextFrameId(),
            });
        };
        canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onFatal(new Error('WebGL context lost'));
        });
        return {
            id: 'webgl',
            renderFrame: drawFrame,
            destroy: () => {
                gl.deleteBuffer(buffer);
                gl.deleteProgram(program);
            },
        };
    },
});

export const createShaderBackends = <UniformData>(
    config: ShaderBackendConfig<UniformData>
): Backend<UniformData>[] => {
    const backends: Backend<UniformData>[] = [];

    if (config.webgpu) {
        backends.push(createWebGPUShaderBackend<UniformData>(config.webgpu));
    }

    if (config.webgl) {
        backends.push(createWebGLShaderBackend<UniformData>(config.webgl));
    }

    return backends;
};
