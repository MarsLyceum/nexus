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

export type WebGPUShaderConfig<UniformData> = {
    readonly shaderSource: string;
    readonly entryPoints?: {
        readonly vertex?: string;
        readonly fragment?: string;
    };
    readonly uniformEncoder: ShaderUniformEncoder<UniformData>;
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
        const format = gpu.getPreferredCanvasFormat();
        const configure = (nextMetrics: RenderMetrics) => {
            setCanvasDimensions({ canvas, metrics: nextMetrics });
            context.configure({
                device,
                format,
                alphaMode: 'premultiplied',
            });
        };
        configure(metrics);
        canvas.addEventListener('webgpucontextlost', (event) => {
            event.preventDefault();
            onFatal(new Error('WebGPU context lost'));
        });
        const vertexEntryPoint = config.entryPoints?.vertex ?? 'main';
        const fragmentEntryPoint = config.entryPoints?.fragment ?? 'main';

        const vertexModule = device.createShaderModule({
            code: config.shaderSource,
            label: 'shader-vertex-module',
        });
        const fragmentModule = device.createShaderModule({
            code: config.shaderSource,
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
                                    srcFactor: 'src-alpha',
                                    dstFactor: 'one-minus-src-alpha',
                                },
                                alpha: {
                                    srcFactor: 'one',
                                    dstFactor: 'one-minus-src-alpha',
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
        const drawFrame = (renderInput: RenderInput<UniformData>) =>
            drawWebGpuFrame({
                device,
                pipeline,
                uniformBuffer,
                bindGroup,
                context,
                uniformEncoder,
                renderInput,
            });
        return {
            id: 'webgpu',
            renderFrame: drawFrame,
            destroy: () => {
                uniformBuffer.destroy();
                device.destroy?.();
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
        const drawFrame = (renderInput: RenderInput<UniformData>) =>
            drawWebglFrame({
                gl,
                program,
                buffer,
                uniformEncoder: config.uniformEncoder,
                renderInput,
            });
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
