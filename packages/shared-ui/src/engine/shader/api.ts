import type {
    ShaderBackend,
    ShaderBackendConfig,
    ShaderProgram,
    ShaderSource,
    UniformEncoder,
    WebGLUniformEncoder,
    RenderCommand,
    BackendCapabilities,
} from './types';
import { createWebGPUBackend } from './backends/webgpu';
import { createWebGLBackend } from './backends/webgl';
import { checkWebGPUAvailable } from './backends/webgpu-utils';
import { checkWebGLAvailable } from './backends/webgl-utils';

export type ShaderEngineConfig<State> = {
    readonly canvas: HTMLCanvasElement;
    readonly source: ShaderSource;
    readonly uniformEncoder: {
        readonly webgpu?: UniformEncoder<State>;
        readonly webgl?: WebGLUniformEncoder<State>;
    };
    readonly initialMetrics: {
        readonly width: number;
        readonly height: number;
        readonly dpr: number;
    };
    readonly preferredBackend?: 'webgpu' | 'webgl';
    readonly debug?: {
        readonly enabled: boolean;
        readonly bindGroupIndex?: number;
        readonly invocationCapacity?: number;
    };
    readonly onError?: (error: Error) => void;
};

export type ShaderEngine<State> = {
    readonly program: ShaderProgram<State>;
    readonly backend: 'webgpu' | 'webgl';
    readonly render: (command: RenderCommand<State>) => void;
    readonly destroy: () => void;
};

const selectBackend = <State>(
    backends: ReadonlyArray<ShaderBackend<State>>,
    preferred?: 'webgpu' | 'webgl'
): ShaderBackend<State> | undefined => {
    if (preferred) {
        const match = backends.find(
            (backend) => backend.type === preferred && backend.isAvailable()
        );
        if (match) {
            return match;
        }
    }

    return backends.find((backend) => backend.isAvailable());
};

export const createShaderEngine = async <State>(
    config: ShaderEngineConfig<State>
): Promise<ShaderEngine<State>> => {
    const backends: ShaderBackend<State>[] = [];

    if (config.source.webgpu && config.uniformEncoder.webgpu) {
        backends.push(createWebGPUBackend<State>());
    }

    if (config.source.webgl && config.uniformEncoder.webgl) {
        backends.push(createWebGLBackend<State>());
    }

    if (backends.length === 0) {
        throw new Error('No shader backends configured');
    }

    const backend = selectBackend(backends, config.preferredBackend);
    if (!backend) {
        throw new Error('No available shader backend');
    }

    const backendConfig: ShaderBackendConfig<State> = {
        canvas: config.canvas,
        source: config.source,
        uniformEncoder: config.uniformEncoder,
        metrics: {
            width: config.initialMetrics.width,
            height: config.initialMetrics.height,
            dpr: config.initialMetrics.dpr,
        },
        debug: config.debug,
        onError: config.onError,
    };

    const program = await backend.createProgram(backendConfig);

    return {
        program,
        backend: backend.type,
        render: (command) => program.render(command),
        destroy: () => program.destroy(),
    };
};

export const getAvailableBackends = (): BackendCapabilities[] => [
    { backend: 'webgpu', isAvailable: checkWebGPUAvailable },
    { backend: 'webgl', isAvailable: checkWebGLAvailable },
];

export const getBestAvailableBackend = (): 'webgpu' | 'webgl' | undefined => {
    const backends = getAvailableBackends();

    const webgpu = backends.find(
        (b) => b.backend === 'webgpu' && b.isAvailable()
    );
    if (webgpu) {
        return 'webgpu';
    }

    const webgl = backends.find(
        (b) => b.backend === 'webgl' && b.isAvailable()
    );
    if (webgl) {
        return 'webgl';
    }

    return undefined;
};
