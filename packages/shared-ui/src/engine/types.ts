export type RenderMetrics = {
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
};

export type RenderInput<UniformData> = {
    readonly metrics: RenderMetrics;
    readonly uniformData: UniformData;
};

export type BackendHandle<UniformData> = {
    readonly id: string;
    readonly renderFrame: (input: RenderInput<UniformData>) => void;
    readonly destroy: () => void;
};

export type BackendContext = {
    readonly canvas: HTMLCanvasElement;
    readonly metrics: RenderMetrics;
    readonly onFatal: (error: Error) => void;
};

export type Backend<UniformData> = {
    readonly id: string;
    readonly isAvailable: () => boolean | Promise<boolean>;
    readonly create: (
        context: BackendContext
    ) => Promise<BackendHandle<UniformData>>;
};

export type Timeline = {
    readonly getTimeSeconds: () => number;
};

export type EngineState = Record<string, unknown>;

type EffectCallback<Args extends ReadonlyArray<unknown>, Return> = {
    bivarianceHack(...args: Args): Return;
}['bivarianceHack'];

export type EffectDescriptor<State extends EngineState, UniformData> = {
    readonly id: string;
    readonly displayName: string;
    readonly description?: string;
    readonly initialState: State;
    readonly metrics: EffectCallback<[State], RenderMetrics>;
    readonly computeUniforms: EffectCallback<
        [
            {
                readonly state: State;
                readonly time: number;
            },
        ],
        UniformData
    >;
    readonly createBackends: () => ReadonlyArray<Backend<UniformData>>;
    readonly backendPreference?: ReadonlyArray<string>;
};

export type EngineControl<State extends EngineState> = {
    readonly update: (state: Partial<State>) => void;
    readonly start: () => void;
    readonly stop: () => void;
    readonly dispose: () => void;
    readonly setDesiredBackend: (
        backend: string
    ) => Promise<string | undefined>;
    readonly getActiveBackend: () => string | undefined;
};

export type EngineOptions<State extends EngineState, UniformData> = {
    readonly canvas: HTMLCanvasElement;
    readonly timeline: Timeline;
    readonly initialState: State;
    readonly metrics: (state: State) => RenderMetrics;
    readonly computeUniforms: (input: {
        readonly state: State;
        readonly time: number;
    }) => UniformData;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly backendPreference?: ReadonlyArray<string>;
    readonly onBackendChange?: (backend: string | undefined) => void;
    readonly onReady?: () => void;
    readonly onError?: (error: Error) => void;
};
