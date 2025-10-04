import type { EffectDescriptor, EngineState } from '../engine';
import { glowEffectDescriptor } from '../effects/glow';

export type AnyEffectDescriptor = EffectDescriptor<EngineState, unknown>;

export type EffectRegistryEntry<
    State extends EngineState = EngineState,
    UniformState = unknown,
> = EffectDescriptor<State, UniformState>;

export type EffectRegistryMap = Map<string, AnyEffectDescriptor>;

const createRegistry = (
    effects: ReadonlyArray<AnyEffectDescriptor> = []
): EffectRegistryMap => new Map(effects.map((effect) => [effect.id, effect]));

export const builtInEffects: ReadonlyArray<AnyEffectDescriptor> = [
    glowEffectDescriptor as AnyEffectDescriptor,
];

export const createBuiltInEffectRegistry = (): EffectRegistryMap =>
    createRegistry(builtInEffects);

export const globalEffectRegistry = createBuiltInEffectRegistry();

export const registerEffectInGlobalRegistry = <
    State extends EngineState,
    UniformState,
>(
    effect: EffectDescriptor<State, UniformState>
): void => {
    if (globalEffectRegistry.has(effect.id)) {
        throw new Error(
            `Effect "${effect.id}" is already registered. Choose a unique id.`
        );
    }
    globalEffectRegistry.set(effect.id, effect as AnyEffectDescriptor);
};

export const getEffectFromGlobalRegistry = (
    effectId: string
): AnyEffectDescriptor | undefined => globalEffectRegistry.get(effectId);

export const listEffectsInGlobalRegistry =
    (): ReadonlyArray<AnyEffectDescriptor> => [
        ...globalEffectRegistry.values(),
    ];
