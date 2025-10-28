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
    createShaderEngine,
    getAvailableBackends,
    getBestAvailableBackend,
    createUniformEncoder,
    setCanvasSize,
} from '../engine';

export type {
    ShaderEngineConfig,
    ShaderEngine,
    UniformData as ShaderUniformData,
    UniformEncoder as ShaderUniformEncoder,
    ShaderSource,
    ShaderBackend,
} from '../engine';

export { hasWebGL, hasWebGPU } from '../engine';

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
    SceneRenderDiagnostics,
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
