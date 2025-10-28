import type { Backend, BackendContext, BackendHandle } from './types';
import { resolveShaderSource } from './shaderUtils';
import type { UniformEncoder, WebGLUniformEncoder } from './shader/types';
import {
    createWebGPUBackend,
    createWebGLBackend,
    createUniformEncoder,
} from './shader';
import {
    createWebGLUniformEncoder,
    createWebGPUWriter,
    countUniformFloats,
    type UniformSchema,
} from './uniformSchema';

export type StandardBackendConfig<UniformData> = {
    readonly uniformSchema: UniformSchema<UniformData>;
    readonly webgpu?: {
        readonly shaderSource: string;
        readonly entryPoints: {
            readonly vertex: string;
            readonly fragment: string;
        };
    };
    readonly webgl?: {
        readonly vertexShader: string;
        readonly fragmentShader: string;
    };
};

type ProgramConfig<UniformData> = {
    readonly canvas: HTMLCanvasElement;
    readonly source: {
        readonly webgpu?: {
            readonly code: string;
            readonly entryPoints: {
                readonly vertex: string;
                readonly fragment: string;
            };
        };
        readonly webgl?: {
            readonly vertex: string;
            readonly fragment: string;
        };
    };
    readonly uniformEncoder: {
        readonly webgpu?: UniformEncoder<UniformData>;
        readonly webgl?: WebGLUniformEncoder<UniformData>;
    };
    readonly metrics: {
        readonly width: number;
        readonly height: number;
        readonly dpr: number;
    };
    readonly onError: (error: Error) => void;
};

type ShaderProgram<UniformData> = {
    readonly id: string;
    readonly render: (input: {
        readonly uniformData: UniformData;
        readonly metrics: {
            readonly width: number;
            readonly height: number;
            readonly dpr: number;
        };
    }) => void;
    readonly destroy: () => void;
};

type ShaderBackend<UniformData> = {
    readonly isAvailable: () => boolean;
    readonly createProgram: (
        config: ProgramConfig<UniformData>
    ) => Promise<ShaderProgram<UniformData>>;
};

const createBackendHandle = <UniformData>(
    program: ShaderProgram<UniformData>
): BackendHandle<UniformData> => ({
    id: program.id,
    renderFrame: (input) => {
        program.render({
            uniformData: input.uniformData,
            metrics: input.metrics,
        });
    },
    destroy: program.destroy,
});

const createWebGPUBackendWrapper = <UniformData>(
    webgpuConfig: NonNullable<StandardBackendConfig<UniformData>['webgpu']>,
    uniformSchema: UniformSchema<UniformData>
): Backend<UniformData> => {
    const backend: ShaderBackend<UniformData> =
        createWebGPUBackend<UniformData>();

    return {
        id: 'webgpu',
        isAvailable: backend.isAvailable,
        create: async (context: BackendContext) => {
            const program = await backend.createProgram({
                canvas: context.canvas,
                source: {
                    webgpu: {
                        code: resolveShaderSource(webgpuConfig.shaderSource),
                        entryPoints: webgpuConfig.entryPoints,
                    },
                },
                uniformEncoder: {
                    webgpu: createUniformEncoder(
                        createWebGPUWriter(uniformSchema),
                        countUniformFloats(uniformSchema)
                    ),
                },
                metrics: context.metrics,
                onError: context.onFatal,
            });

            return createBackendHandle(program);
        },
    };
};

const createWebGLBackendWrapper = <UniformData>(
    webglConfig: NonNullable<StandardBackendConfig<UniformData>['webgl']>,
    uniformSchema: UniformSchema<UniformData>
): Backend<UniformData> => {
    const backend: ShaderBackend<UniformData> =
        createWebGLBackend<UniformData>();

    return {
        id: 'webgl',
        isAvailable: backend.isAvailable,
        create: async (context: BackendContext) => {
            const program = await backend.createProgram({
                canvas: context.canvas,
                source: {
                    webgl: {
                        vertex: resolveShaderSource(webglConfig.vertexShader),
                        fragment: resolveShaderSource(
                            webglConfig.fragmentShader
                        ),
                    },
                },
                uniformEncoder: {
                    webgl: createWebGLUniformEncoder(uniformSchema),
                },
                metrics: context.metrics,
                onError: context.onFatal,
            });

            return createBackendHandle(program);
        },
    };
};

export const createStandardBackends = <UniformData>(
    config: StandardBackendConfig<UniformData>
): ReadonlyArray<Backend<UniformData>> => {
    const backends: Backend<UniformData>[] = [];

    if (config.webgpu) {
        backends.push(
            createWebGPUBackendWrapper(config.webgpu, config.uniformSchema)
        );
    }

    if (config.webgl) {
        backends.push(
            createWebGLBackendWrapper(config.webgl, config.uniformSchema)
        );
    }

    return backends;
};

export const hasWebGL = (): boolean => {
    const backend = createWebGLBackend();
    return backend.isAvailable();
};

export const hasWebGPU = (): boolean => {
    const backend = createWebGPUBackend();
    return backend.isAvailable();
};
