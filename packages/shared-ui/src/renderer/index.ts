export { EffectScene, EffectSceneProps } from './EffectScene';

export {
    EffectRegistryEntry,
    EffectRegistryMap,
    builtInEffects,
    createBuiltInEffectRegistry,
    registerEffectInGlobalRegistry,
    getEffectFromGlobalRegistry,
    listEffectsInGlobalRegistry,
} from './EffectRegistry';

export type {
    Backend,
    BackendHandle,
    BackendContext,
    RenderInput,
    RenderMetrics,
    EngineState,
    EngineControl,
    EngineOptions,
    EffectDescriptor,
    Timeline,
} from '../engine';

export {
    createEngine,
    createEffectEngine,
    createEffectRegistry,
    registerEffect,
    getEffect,
    listEffects,
    globalEffectRegistry,
    mergeState,
    buildBackendOrder,
    toError,
} from '../engine';

export {
    createWebGPUShaderBackend,
    createWebGLShaderBackend,
    createShaderBackends,
    hasWebGL,
    hasWebGPU,
} from '../engine/shaderBackends';

export type {
    ShaderUniformData,
    ShaderUniformEncoder,
    WebGPUShaderConfig,
    WebGLShaderConfig,
    ShaderBackendConfig,
} from '../engine/shaderBackends';

export { EffectRenderer, EffectRendererWithMetrics } from '../engine';

export type { EffectRendererProps } from '../engine/components/EffectRenderer';

export type { EffectRendererWithMetricsProps } from '../engine/components/EffectRendererWithMetrics';

export {
    Scene,
    SceneConfig,
    SceneStatus,
    SceneRenderLayer,
    SceneRenderLayerType,
    SceneRenderLayerPlacement,
    SceneRenderResult,
    SceneRenderOptions,
    SceneActiveBackend,
    ScenePreferredBackend,
    buildScene,
    resolveVisibility,
} from '../animation/sceneSystem';

export {
    SceneRenderer,
    SceneRendererHook,
    SceneRendererRegistry,
    registerSceneRenderer,
    getSceneRenderer,
    useSceneRenderer,
    createSceneRenderer,
} from '../animation/sceneRenderer';
