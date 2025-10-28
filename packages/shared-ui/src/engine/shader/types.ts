import type { RenderMetrics } from '../types';

export type ShaderBackendType = 'webgpu' | 'webgl';

export type UniformData = Float32Array | Uint32Array;

export type UniformEncoder<State> = {
    readonly encode: (state: State) => UniformData;
    readonly bufferSize: number;
};

export type WebGLUniformEncoder<State> = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    state: State
) => void;

export type ShaderSource = {
    readonly webgpu?: {
        readonly code: string;
        readonly entryPoints?: {
            readonly vertex?: string;
            readonly fragment?: string;
        };
    };
    readonly webgl?: {
        readonly vertex: string;
        readonly fragment: string;
    };
};

export type ShaderProgramHandle = {
    readonly id: string;
    readonly backend: ShaderBackendType;
    readonly destroy: () => void;
};

export type RenderCommand<State> = {
    readonly uniformData: State;
    readonly metrics: RenderMetrics;
};

export type ShaderProgram<State> = {
    readonly id: string;
    readonly backend: ShaderBackendType;
    readonly render: (command: RenderCommand<State>) => void;
    readonly destroy: () => void;
};

export type ShaderBackendConfig<State> = {
    readonly canvas: HTMLCanvasElement;
    readonly source: ShaderSource;
    readonly uniformEncoder: {
        readonly webgpu?: UniformEncoder<State>;
        readonly webgl?: WebGLUniformEncoder<State>;
    };
    readonly metrics: RenderMetrics;
    readonly debug?: ShaderDebugConfig;
    readonly onError?: (error: Error) => void;
};

export type ShaderDebugConfig = {
    readonly enabled: boolean;
    readonly bindGroupIndex?: number;
    readonly invocationCapacity?: number;
};

export type BackendCapabilities = {
    readonly backend: ShaderBackendType;
    readonly isAvailable: () => boolean;
};

export type ShaderBackend<State> = {
    readonly type: ShaderBackendType;
    readonly isAvailable: () => boolean;
    readonly createProgram: (
        config: ShaderBackendConfig<State>
    ) => Promise<ShaderProgram<State>>;
};
