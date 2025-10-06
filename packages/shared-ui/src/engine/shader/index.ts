export {
    createShaderEngine,
    getAvailableBackends,
    getBestAvailableBackend,
    type ShaderEngineConfig,
    type ShaderEngine,
} from './api';

export {
    createUniformEncoder,
    setCanvasSize,
    computeHash,
    selectFirst,
    type CanvasDimensions,
} from './resources';

export { createWebGPUBackend } from './backends/webgpu';
export { createWebGLBackend } from './backends/webgl';

export type {
    ShaderBackendType,
    UniformData,
    UniformEncoder,
    WebGLUniformEncoder,
    ShaderSource,
    ShaderProgramHandle,
    RenderCommand,
    ShaderProgram,
    ShaderDebugConfig,
    BackendCapabilities,
    ShaderBackend,
} from './types';
