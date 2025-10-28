import type { EffectDescriptor, EngineState } from './types';
import {
    createStandardBackends,
    type StandardBackendConfig,
} from './backendFactory';

export type EffectConfig<State extends EngineState, UniformData> = {
    readonly id: string;
    readonly displayName: string;
    readonly description?: string;
    readonly initialState: State;
    readonly computeUniforms: (state: State, time: number) => UniformData;
    readonly backends: StandardBackendConfig<UniformData>;
    readonly backendPreference?: ReadonlyArray<string>;
};

export const defineEffect = <State extends EngineState, UniformData>(
    config: EffectConfig<State, UniformData>
): EffectDescriptor<State, UniformData> => ({
    id: config.id,
    displayName: config.displayName,
    description: config.description,
    initialState: config.initialState,
    metrics: (state) => ({
        width: (state as Record<string, unknown>).width as number,
        height: (state as Record<string, unknown>).height as number,
        dpr: (state as Record<string, unknown>).dpr as number,
    }),
    computeUniforms: ({ state, time }) => config.computeUniforms(state, time),
    createBackends: () => createStandardBackends(config.backends),
    backendPreference: config.backendPreference ?? ['webgpu', 'webgl'],
});
