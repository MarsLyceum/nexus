import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Platform } from 'react-native';

import {
    buildScene as buildGenericScene,
    resolveVisibility,
    type Scene,
    type SceneRenderDiagnostics,
    type SceneRenderLayer,
    type SceneRenderOptions,
    type SceneRenderResult,
    type SceneStatus,
    type SceneActiveBackend,
    type SceneBackendPreference,
    type ScenePreferredBackend,
} from '../animation/sceneSystem';
import {
    createSceneRenderer,
    registerSceneRenderer,
} from '../animation/sceneRenderer';
import { useAnimationTimeline } from '../animation/timeline';
import { hasWebGL, hasWebGPU } from '../engine';

type EffectAvailability = {
    readonly webgpu: boolean;
    readonly webgl: boolean;
};

export type EffectSceneLayerIds = {
    readonly base: string;
    readonly css: string;
    readonly gpu: string;
};

type SceneOptions<State extends Record<string, unknown>> = {
    readonly backendPreference?: SceneBackendPreference;
    readonly fallbackToCss?: boolean;
    readonly cssRenderer?: () => ReactNode;
    readonly metadata?: Record<string, unknown>;
};

export type EffectSceneBaseContext<State extends Record<string, unknown>> = {
    readonly timeline: ReturnType<typeof useAnimationTimeline>;
    readonly isWeb: boolean;
    readonly availability: EffectAvailability;
    readonly visibility: Partial<Record<string, boolean>> | undefined;
    readonly preferredBackend: ScenePreferredBackend;
    readonly showCssLayer: boolean;
    readonly shouldRenderGpuLayer: boolean;
    readonly status: SceneStatus;
    readonly activeBackend: SceneActiveBackend;
    readonly layerIds: EffectSceneLayerIds;
    readonly handleActiveBackendChange: (backend: SceneActiveBackend) => void;
    readonly registerReady: () => void;
    readonly registerFailure: (error: Error) => void;
    readonly setStatus: (status: SceneStatus) => void;
    readonly setGpuFailed: (value: boolean) => void;
    readonly canUseGpu: boolean;
    readonly wantsCssOnly: boolean;
    readonly isGpuVisibilityEnabled: boolean;
    readonly shouldAttemptGpu: boolean;
    readonly gpuFailed: boolean;
    readonly resolveLayerVisibility: (
        layerId: string,
        fallback?: boolean
    ) => boolean;
    readonly options: SceneRenderOptions | undefined;
    readonly diagnostics: SceneRenderDiagnostics | undefined;
    readonly setDiagnostics: Dispatch<
        SetStateAction<SceneRenderDiagnostics | undefined>
    >;
};

export type EffectSceneDerivedContext<State extends Record<string, unknown>> = {
    readonly state: State;
    readonly base: EffectSceneBaseContext<State>;
};

export type EffectSceneContainerContext<
    State extends Record<string, unknown>,
    Derived,
> = {
    readonly state: State;
    readonly base: EffectSceneBaseContext<State>;
    readonly derived: Derived;
};

export type EffectSceneLayerContext<
    State extends Record<string, unknown>,
    Derived,
> = EffectSceneContainerContext<State, Derived>;

export type EffectSceneGpuLayerContext<
    State extends Record<string, unknown>,
    Derived,
> = EffectSceneLayerContext<State, Derived> & {
    readonly onReady: () => void;
    readonly onFailure: (error: Error) => void;
};

export type EffectSceneConfig<
    State extends Record<string, unknown>,
    Derived = undefined,
> = {
    readonly id: string;
    readonly defaultState: State;
    readonly resolveState?: (input: Partial<State>) => State;
    readonly detectAvailability?: () => EffectAvailability;
    readonly layerIds?: Partial<EffectSceneLayerIds>;
    readonly useDerivedState?: (
        context: EffectSceneDerivedContext<State>
    ) => Derived;
    readonly buildContainerStyle: (
        context: EffectSceneContainerContext<State, Derived>
    ) => Record<string, unknown>;
    readonly createLayers: {
        readonly base?: (
            context: EffectSceneLayerContext<State, Derived>
        ) => SceneRenderLayer | null;
        readonly css?: (
            context: EffectSceneLayerContext<State, Derived>
        ) => SceneRenderLayer | null;
        readonly gpu?: (
            context: EffectSceneGpuLayerContext<State, Derived>
        ) => SceneRenderLayer | null;
    };
    readonly createSceneOptions?: (
        state: State
    ) => SceneOptions<State> | undefined;
};

const defaultAvailability: EffectAvailability = {
    webgpu: false,
    webgl: false,
};

const detectGpuAvailability = (): EffectAvailability => ({
    webgpu: hasWebGPU(),
    webgl: hasWebGL(),
});

const defaultResolveLayerVisibility = (
    visibility: Partial<Record<string, boolean>> | undefined,
    layerId: string,
    fallback: boolean
) => resolveVisibility(visibility, layerId, fallback);

const createDefaultLayerIds = (effectId: string): EffectSceneLayerIds => ({
    base: `${effectId}-base` as const,
    css: `${effectId}-css` as const,
    gpu: `${effectId}-gpu` as const,
});

const defaultResolveState = <State extends Record<string, unknown>>(
    defaults: State,
    input: Partial<State>
): State => ({
    ...defaults,
    ...input,
});

type SceneRendererHook<State extends Record<string, unknown>> = (
    state: State,
    options?: SceneRenderOptions
) => SceneRenderResult;

type EffectSceneFactory<State extends Record<string, unknown>> = {
    readonly buildScene: (input: Partial<State>) => Scene<State>;
};

export const createEffectScene = <
    State extends Record<string, unknown>,
    Derived = undefined,
>(
    config: EffectSceneConfig<State, Derived>
): EffectSceneFactory<State> => {
    const resolveState =
        config.resolveState ??
        ((input: Partial<State>) =>
            defaultResolveState<State>(config.defaultState, input));
    const layerIds: EffectSceneLayerIds = {
        ...createDefaultLayerIds(config.id),
        ...config.layerIds,
    };
    const detectAvailability =
        config.detectAvailability ?? detectGpuAvailability;
    const { buildContainerStyle } = config;
    const baseLayerFactory = config.createLayers.base;
    const cssLayerFactory = config.createLayers.css;
    const gpuLayerFactory = config.createLayers.gpu;
    const { createSceneOptions } = config;

    const useRenderer: SceneRendererHook<State> = (state, options) => {
        const timeline = useAnimationTimeline();
        const isWeb = Platform.OS === 'web';
        const visibility = useMemo(
            () => options?.visibility,
            [options?.visibility]
        );
        const [availability, setAvailability] = useState<EffectAvailability>(
            () => (isWeb ? detectAvailability() : defaultAvailability)
        );

        const preferredBackend = useMemo(() => {
            if (
                options?.preferredBackend &&
                options.preferredBackend !== 'auto'
            ) {
                return options.preferredBackend;
            }
            if (availability.webgpu) {
                return 'webgpu';
            }
            if (availability.webgl) {
                return 'webgl';
            }
            return options?.preferredBackend ?? 'auto';
        }, [
            availability.webgl,
            availability.webgpu,
            options?.preferredBackend,
        ]);
        const wantsCssOnly = preferredBackend === 'css';

        useEffect(() => {
            if (!isWeb) {
                setAvailability(defaultAvailability);
                return;
            }
            const next = detectAvailability();
            setAvailability((current) =>
                current.webgpu === next.webgpu && current.webgl === next.webgl
                    ? current
                    : next
            );
        }, [detectAvailability, isWeb]);

        const canUseGpu = isWeb && (availability.webgpu || availability.webgl);
        const resolveLayerVisibility = useCallback(
            (layerId: string, fallback = true) =>
                defaultResolveLayerVisibility(visibility, layerId, fallback),
            [visibility]
        );
        const isGpuVisibilityEnabled = !wantsCssOnly
            ? resolveLayerVisibility(layerIds.gpu, true)
            : false;
        const baseShouldAttempt =
            canUseGpu && !wantsCssOnly && isGpuVisibilityEnabled;

        const [status, setStatus] = useState<SceneStatus>(
            baseShouldAttempt ? 'pending' : 'ready'
        );
        const [gpuFailed, setGpuFailed] = useState(false);
        const [activeBackend, setActiveBackend] = useState<
            SceneActiveBackend | undefined
        >(undefined);
        const [diagnostics, setDiagnostics] = useState<
            SceneRenderDiagnostics | undefined
        >(undefined);
        const diagnosticsRef = useRef<SceneRenderDiagnostics | null>(null);

        useEffect(() => {
            setStatus(baseShouldAttempt ? 'pending' : 'ready');
        }, [baseShouldAttempt]);

        useEffect(() => {
            setGpuFailed(false);
        }, [state, canUseGpu, isGpuVisibilityEnabled]);

        const updateDiagnostics = useCallback(
            (
                updater: (
                    current: SceneRenderDiagnostics | undefined
                ) => SceneRenderDiagnostics | undefined
            ) => {
                setDiagnostics((current) => {
                    const next = updater(current);
                    diagnosticsRef.current = next ?? null;
                    return next;
                });
            },
            []
        );

        useEffect(() => {
            diagnosticsRef.current = diagnostics ?? null;
        }, [diagnostics]);

        const handleActiveBackendChange = useCallback(
            (nextBackend: SceneActiveBackend) => {
                setActiveBackend(nextBackend);
            },
            []
        );

        const shouldRenderGpuLayer =
            isWeb &&
            baseShouldAttempt &&
            !gpuFailed &&
            status !== 'failed' &&
            activeBackend !== undefined;
        const showCssLayer = isWeb
            ? !shouldRenderGpuLayer || gpuFailed || wantsCssOnly
            : false;

        const markBackendFailure = useCallback(
            (backend: string, error: Error) => {
                let nextDiagnostics: SceneRenderDiagnostics | undefined;
                updateDiagnostics((current) => {
                    const existing = current ?? {
                        failedBackends: [],
                        backendErrors: {},
                    };
                    if (existing.backendErrors[backend]) {
                        nextDiagnostics = existing;
                        return existing;
                    }
                    const updated = {
                        failedBackends: [...existing.failedBackends, backend],
                        backendErrors: {
                            ...existing.backendErrors,
                            [backend]: error,
                        },
                    };
                    nextDiagnostics = updated;
                    return updated;
                });
                const preferredFallback = (() => {
                    if (
                        !options?.preferredBackend ||
                        options.preferredBackend === 'auto'
                    ) {
                        return undefined;
                    }
                    if (options.preferredBackend === 'css') {
                        return ['webgl', 'css'];
                    }
                    return [options.preferredBackend, 'webgl', 'css'];
                })();
                const availableBackends = (
                    preferredFallback ?? [
                        availability.webgpu ? 'webgpu' : undefined,
                        availability.webgl ? 'webgl' : undefined,
                        'css',
                    ]
                ).filter(
                    (candidate): candidate is string => candidate !== undefined
                );
                const remaining = availableBackends.filter(
                    (candidate) =>
                        candidate !== backend &&
                        !nextDiagnostics?.backendErrors[candidate]
                );
                const nextTarget = remaining[0];
                const hasFallback = remaining.length > 0 && Boolean(nextTarget);
                if (hasFallback) {
                    console.warn(
                        `[EffectScene:${config.id}] backend failed, attempting fallback`,
                        {
                            failedBackend: backend,
                            nextTarget,
                            remaining,
                            message: error.message,
                        }
                    );
                } else {
                    console.error(
                        `[EffectScene:${config.id}] all GPU backends failed`,
                        {
                            failedBackend: backend,
                            remaining,
                            message: error.message,
                        }
                    );
                }
                return { remaining, nextTarget, hasFallback };
            },
            [
                availability.webgl,
                availability.webgpu,
                config.id,
                options?.preferredBackend,
                updateDiagnostics,
            ]
        );

        const registerReady = useCallback(() => {
            setStatus('ready');
            setGpuFailed(false);
            diagnosticsRef.current = null;
            setDiagnostics(undefined);
        }, []);

        const registerFailure = useCallback(
            (error: Error) => {
                console.error(`[EffectScene:${config.id}] GPU failed`, error);
                setStatus('failed');
                setGpuFailed(true);
            },
            [config.id]
        );

        const baseContext = useMemo<EffectSceneBaseContext<State>>(
            () => ({
                timeline,
                isWeb,
                availability,
                visibility,
                preferredBackend,
                showCssLayer,
                shouldRenderGpuLayer,
                status,
                activeBackend,
                layerIds,
                handleActiveBackendChange,
                registerReady,
                registerFailure,
                setStatus,
                setGpuFailed,
                canUseGpu,
                wantsCssOnly,
                isGpuVisibilityEnabled,
                shouldAttemptGpu: baseShouldAttempt,
                gpuFailed,
                resolveLayerVisibility,
                options,
                diagnostics,
                setDiagnostics,
            }),
            [
                timeline,
                isWeb,
                availability,
                visibility,
                preferredBackend,
                showCssLayer,
                shouldRenderGpuLayer,
                status,
                activeBackend,
                layerIds,
                handleActiveBackendChange,
                registerReady,
                registerFailure,
                setStatus,
                setGpuFailed,
                canUseGpu,
                wantsCssOnly,
                isGpuVisibilityEnabled,
                baseShouldAttempt,
                gpuFailed,
                resolveLayerVisibility,
                options,
                diagnostics,
                setDiagnostics,
            ]
        );

        const derived = config.useDerivedState
            ? config.useDerivedState({
                  state,
                  base: baseContext,
              })
            : (undefined as Derived);

        const containerStyle = useMemo(
            () =>
                buildContainerStyle({
                    state,
                    base: baseContext,
                    derived,
                }),
            [buildContainerStyle, state, baseContext, derived]
        );

        const baseLayer = useMemo(() => {
            if (!baseLayerFactory) {
                return null;
            }
            if (!baseContext.resolveLayerVisibility(layerIds.base, true)) {
                return null;
            }
            return baseLayerFactory({
                state,
                base: baseContext,
                derived,
            });
        }, [baseLayerFactory, baseContext, derived, layerIds.base, state]);

        const cssLayer = useMemo(() => {
            if (
                !cssLayerFactory ||
                !baseContext.isWeb ||
                !baseContext.showCssLayer
            ) {
                return null;
            }
            if (!baseContext.resolveLayerVisibility(layerIds.css, true)) {
                return null;
            }
            return cssLayerFactory({
                state,
                base: baseContext,
                derived,
            });
        }, [cssLayerFactory, baseContext, derived, layerIds.css, state]);

        const gpuLayer = useMemo(() => {
            if (!gpuLayerFactory || !baseContext.shouldRenderGpuLayer) {
                return null;
            }
            if (!baseContext.resolveLayerVisibility(layerIds.gpu, true)) {
                return null;
            }
            return gpuLayerFactory({
                state,
                base: baseContext,
                derived,
                onReady: baseContext.registerReady,
                onFailure: (error) => {
                    const { remaining, nextTarget, hasFallback } =
                        markBackendFailure(baseContext.activeBackend, error);
                    if (hasFallback && nextTarget) {
                        console.log(
                            `[EffectScene:${config.id}] applying fallback backend`,
                            {
                                from: baseContext.activeBackend,
                                to: nextTarget,
                            }
                        );
                        if (nextTarget === 'css') {
                            baseContext.handleActiveBackendChange('css');
                            baseContext.setGpuFailed(true);
                            baseContext.setStatus('ready');
                            return;
                        }
                        baseContext.handleActiveBackendChange(nextTarget);
                        baseContext.setGpuFailed(false);
                        baseContext.setStatus('pending');
                        return;
                    }
                    registerFailure(error);
                },
            });
        }, [
            gpuLayerFactory,
            baseContext,
            derived,
            layerIds.gpu,
            registerFailure,
            markBackendFailure,
            state,
        ]);

        const layers = useMemo(
            () =>
                [baseLayer, cssLayer, gpuLayer].filter(
                    (layer): layer is SceneRenderLayer => layer !== null
                ),
            [baseLayer, cssLayer, gpuLayer]
        );

        return {
            layers,
            containerStyle,
            status: baseContext.status,
            activeBackend: baseContext.activeBackend,
            diagnostics,
        };
    };

    const renderer = createSceneRenderer<State>(config.id, useRenderer);
    registerSceneRenderer(renderer);

    const buildScene = (input: Partial<State>): Scene<State> => {
        const state = resolveState(input);
        const sceneOptions = createSceneOptions?.(state);
        return buildGenericScene<State>(
            config.id,
            state,
            sceneOptions
                ? {
                      backendPreference: sceneOptions.backendPreference,
                      fallbackToCss: sceneOptions.fallbackToCss,
                      cssRenderer: sceneOptions.cssRenderer,
                      metadata: sceneOptions.metadata,
                  }
                : undefined
        );
    };

    return { buildScene };
};
