import React from 'react';

// SceneActiveBackend and ScenePreferredBackend are just string types now

export type SceneStatus = 'pending' | 'ready' | 'failed';

export type SceneRenderLayerType = 'dom' | 'gpu' | 'css' | 'canvas';

export type SceneRenderLayerPlacement = 'background' | 'content' | 'foreground';

export type SceneRenderLayer = {
    readonly id: string;
    readonly type: SceneRenderLayerType;
    readonly placement: SceneRenderLayerPlacement;
    readonly element: React.ReactNode | null;
};

export type SceneBackendPreference = ReadonlyArray<string> | 'css';

export type SceneRenderDiagnostics = {
    readonly failedBackends: ReadonlyArray<string>;
    readonly backendErrors: Record<string, Error>;
};

export type SceneConfig<State extends Record<string, unknown>> = {
    readonly effectId: string;
    readonly state: Partial<State>;
    readonly backendPreference?: SceneBackendPreference;
    readonly fallbackToCss?: boolean;
    readonly cssRenderer?: () => React.ReactNode;
    readonly metadata?: Record<string, unknown>;
};

export type Scene<
    State extends Record<string, unknown> = Record<string, unknown>,
> = {
    readonly kind: string;
    readonly config: SceneConfig<State>;
};

export type SceneActiveBackend = string | 'css' | 'unknown';

export type SceneRenderResult = {
    readonly layers: ReadonlyArray<SceneRenderLayer>;
    readonly containerStyle: Record<string, unknown>;
    readonly status: SceneStatus;
    readonly activeBackend: SceneActiveBackend;
    readonly diagnostics?: SceneRenderDiagnostics;
};

export type ScenePreferredBackend = string | 'auto' | 'css';

export type SceneRenderOptions = {
    readonly visibility?: Partial<Record<string, boolean>>;
    readonly preferredBackend?: ScenePreferredBackend;
};

export const buildScene = <State extends Record<string, unknown>>(
    effectId: string,
    state: Partial<State>,
    options?: {
        readonly backendPreference?: SceneBackendPreference;
        readonly fallbackToCss?: boolean;
        readonly cssRenderer?: () => React.ReactNode;
        readonly metadata?: Record<string, unknown>;
    }
): Scene<State> => ({
    kind: effectId,
    config: {
        effectId,
        state,
        backendPreference: options?.backendPreference,
        fallbackToCss: options?.fallbackToCss ?? true,
        cssRenderer: options?.cssRenderer,
        metadata: options?.metadata,
    },
});

export const resolveVisibility = (
    visibility: Partial<Record<string, boolean>> | undefined,
    id: string,
    fallback = true
): boolean => visibility?.[id] ?? fallback;
