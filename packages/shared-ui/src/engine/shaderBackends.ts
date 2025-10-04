import {
    Backend,
    BackendContext,
    BackendHandle,
    RenderInput,
    RenderMetrics,
} from './types';
import { toError } from './utils';

export type ShaderUniformData = Float32Array | Uint32Array;

export type ShaderUniformEncoder<UniformData> = {
    readonly encodeUniforms: (state: UniformData) => ShaderUniformData;
    readonly uniformBufferSize: number;
};

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
    readonly uniformEncoder: (
        gl: WebGLRenderingContext | WebGL2RenderingContext,
        program: WebGLProgram,
        state: UniformData
    ) => void;
};

export type ShaderBackendConfig<UniformData> = {
    readonly webgpu?: WebGPUShaderConfig<UniformData>;
    readonly webgl?: WebGLShaderConfig<UniformData>;
};

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
    }: BackendContext<UniformData>): Promise<BackendHandle<UniformData>> => {
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
        const shader = device.createShaderModule({
            code: config.shaderSource,
        });
        const entryPoints = config.entryPoints ?? {
            vertex: 'vs',
            fragment: 'fs',
        };
        const pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: shader, entryPoint: entryPoints.vertex ?? 'vs' },
            fragment: {
                module: shader,
                entryPoint: entryPoints.fragment ?? 'fs',
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
            size: config.uniformEncoder.uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: uniformBuffer,
                        size: config.uniformEncoder.uniformBufferSize,
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
        const renderFrame = (input: RenderInput<UniformData>) => {
            if (
                input.metrics.width <= 0 ||
                input.metrics.height <= 0 ||
                input.metrics.dpr <= 0
            ) {
                console.log(
                    '[WebGPUBackend] skipping frame due to invalid metrics',
                    {
                        width: input.metrics.width,
                        height: input.metrics.height,
                        dpr: input.metrics.dpr,
                    }
                );
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
                config.uniformEncoder.encodeUniforms(input.uniformData)
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
            console.log('[WebGPUBackend] submitted frame', {
                width: input.metrics.width,
                height: input.metrics.height,
                dpr: input.metrics.dpr,
            });
        };
        const destroy = () => {
            try {
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
                pass.end();
                device.queue.submit([encoder.finish()]);
            } catch {
                // Ignore errors during cleanup
            }
            detachUncapturedError();
            device.destroy?.();
            void deviceLost;
        };
        return { id: 'webgpu', renderFrame, destroy };
    },
});

export const createWebGLShaderBackend = <UniformData>(
    config: WebGLShaderConfig<UniformData>
): Backend<UniformData> => ({
    id: 'webgl',
    isAvailable: () => hasWebGL(),
    create: async ({
        canvas,
        metrics,
        onFatal,
    }: BackendContext<UniformData>): Promise<BackendHandle<UniformData>> => {
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
            config.vertexShaderSource,
            config.fragmentShaderSource
        );
        gl.useProgram(program);
        const buffer = initFullscreenQuad(gl, program);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(
            gl.ONE,
            gl.ONE_MINUS_SRC_ALPHA,
            gl.ONE,
            gl.ONE_MINUS_SRC_ALPHA
        );
        gl.viewport(0, 0, canvas.width, canvas.height);
        let lastMetrics = metrics;
        const renderFrame = (input: RenderInput<UniformData>) => {
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
            config.uniformEncoder(gl, program, input.uniformData);
            try {
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            } catch (error) {
                onFatal(toError(error));
            }
        };
        const destroy = () => {
            try {
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            } catch {
                // Ignore errors during cleanup
            }
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
        };
        return { id: 'webgl', renderFrame, destroy };
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
