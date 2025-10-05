import { useMemo } from 'react';

import { Scene, SceneRenderResult, SceneRenderOptions } from './sceneSystem';

export type SceneRendererHook<State extends Record<string, unknown>> = (
    state: State,
    options: SceneRenderOptions | undefined
) => SceneRenderResult;

export type SceneRenderer<State extends Record<string, unknown>> = {
    readonly effectId: string;
    readonly useRenderer: SceneRendererHook<State>;
};

export type SceneRendererRegistry = {
    readonly register: <State extends Record<string, unknown>>(
        renderer: SceneRenderer<State>
    ) => SceneRendererRegistry;
    readonly get: <State extends Record<string, unknown>>(
        effectId: string
    ) => SceneRenderer<State> | undefined;
    readonly has: (effectId: string) => boolean;
    readonly list: () => ReadonlyArray<SceneRenderer<Record<string, unknown>>>;
};

const createSceneRendererRegistry = (
    initial: ReadonlyArray<SceneRenderer<Record<string, unknown>>> = []
): SceneRendererRegistry => {
    const byEffectId = new Map<string, SceneRenderer<Record<string, unknown>>>(
        initial.map((renderer) => [renderer.effectId, renderer])
    );

    const register = <State extends Record<string, unknown>>(
        renderer: SceneRenderer<State>
    ): SceneRendererRegistry => {
        const newById = new Map(byEffectId);
        newById.set(
            renderer.effectId,
            renderer as SceneRenderer<Record<string, unknown>>
        );
        return createSceneRendererRegistry([...newById.values()]);
    };

    const get = <State extends Record<string, unknown>>(
        effectId: string
    ): SceneRenderer<State> | undefined => {
        const renderer = byEffectId.get(effectId);
        return renderer as SceneRenderer<State> | undefined;
    };

    const has = (effectId: string) => byEffectId.has(effectId);

    const list = () => [...byEffectId.values()];

    return { register, get, has, list };
};

export const globalSceneRendererRegistry = createSceneRendererRegistry();

export const registerSceneRenderer = <State extends Record<string, unknown>>(
    renderer: SceneRenderer<State>
): void => {
    const existing = globalSceneRendererRegistry.get(renderer.effectId);
    if (existing) {
        throw new Error(
            `Scene renderer for effect "${renderer.effectId}" is already registered.`
        );
    }
    Object.assign(
        globalSceneRendererRegistry,
        globalSceneRendererRegistry.register(renderer)
    );
};

export const getSceneRenderer = <State extends Record<string, unknown>>(
    effectId: string
): SceneRenderer<State> | undefined =>
    globalSceneRendererRegistry.get<State>(effectId);

export const useSceneRenderer = <State extends Record<string, unknown>>(
    scene: Scene<State>,
    options?: SceneRenderOptions
): SceneRenderResult => {
    const renderer = useMemo(
        () => getSceneRenderer<State>(scene.config.effectId),
        [scene.config.effectId]
    );

    const fallbackResult = useMemo<SceneRenderResult>(
        () => ({
            layers: [],
            containerStyle: {},
            status: 'failed',
            activeBackend: 'unknown',
        }),
        []
    );

    const fallbackCss = useMemo(
        () => scene.config.cssRenderer?.(),
        [scene.config]
    );

    if (!renderer) {
        console.log('[sceneRenderer] missing renderer for effect', {
            effectId: scene.config.effectId,
            hasCssFallback: Boolean(scene.config.cssRenderer),
            fallbackToCss: Boolean(scene.config.fallbackToCss),
        });
        if (fallbackCss && scene.config.fallbackToCss) {
            console.log('[sceneRenderer] using css fallback renderer', {
                effectId: scene.config.effectId,
            });
            return {
                layers: [
                    {
                        id: 'css-fallback',
                        type: 'css',
                        placement: 'background',
                        element: fallbackCss,
                    },
                ],
                containerStyle: {},
                status: 'ready',
                activeBackend: 'css',
            };
        }
        return fallbackResult;
    }

    const result = renderer.useRenderer(scene.config.state as State, options);
    console.log('[sceneRenderer] renderer result', {
        effectId: scene.config.effectId,
        status: result.status,
        activeBackend: result.activeBackend,
        layerIds: result.layers.map((layer) => layer.id),
        diagnostics: result.diagnostics
            ? {
                  failedBackends: result.diagnostics.failedBackends,
                  backendErrors: Object.keys(result.diagnostics.backendErrors),
              }
            : undefined,
    });
    return result;
};

export const createSceneRenderer = <State extends Record<string, unknown>>(
    effectId: string,
    useRendererHook: SceneRendererHook<State>
): SceneRenderer<State> => ({
    effectId,
    useRenderer: useRendererHook,
});
