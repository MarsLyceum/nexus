import {
    createEffectCssAnimationStyle,
    createEffectCssKeyframes,
} from '../animation/effectCss';
import {
    createEffectAnimationEvaluator,
    type EffectAnimationSpec,
} from '../animation/effectPropertyMapping';
import type { CssAnimationStyle } from '../animation/cssAnimationUtils';
import { entries } from '../animation/helpers/object';

export type EffectPropertyFormatterFactory<Context> = (
    context: Context
) => (value: number) => string;

export type EffectPropertyFormatterMap<
    PropertyName extends string,
    Context,
> = Record<PropertyName, EffectPropertyFormatterFactory<Context>>;

type EffectBuilderConfig<
    TrackName extends string,
    PropertyName extends string,
    Context,
> = {
    readonly spec: EffectAnimationSpec<TrackName, PropertyName>;
    readonly trackSequence: ReadonlyArray<TrackName>;
    readonly animationNames: Record<TrackName, string>;
    readonly propertyFormatters: EffectPropertyFormatterMap<
        PropertyName,
        Context
    >;
    readonly propertyDeclarations?: ReadonlyArray<string>;
    readonly cssVariables?: Record<string, number | string>;
};

type EffectEvaluator<
    TrackName extends string,
    PropertyName extends string,
> = ReturnType<typeof createEffectAnimationEvaluator<TrackName, PropertyName>>;

const buildPropertyFormatters = <
    TrackName extends string,
    PropertyName extends string,
    Context,
>(
    config: EffectBuilderConfig<TrackName, PropertyName, Context>,
    context: Context
): Record<PropertyName, (value: number) => string> =>
    entries(config.propertyFormatters).reduce(
        (accumulated, [property, factory]) => ({
            ...accumulated,
            [property]: factory(context),
        }),
        {} as Record<PropertyName, (value: number) => string>
    );

export type EffectDefinition<
    TrackName extends string,
    PropertyName extends string,
    Context,
> = EffectEvaluator<TrackName, PropertyName> & {
    readonly createPropertyFormatters: (
        context: Context
    ) => Record<PropertyName, (value: number) => string>;
    readonly createKeyframes: (context: Context) => string;
    readonly createAnimationStyle: (
        elapsedSeconds?: number
    ) => CssAnimationStyle;
    readonly spec: EffectAnimationSpec<TrackName, PropertyName>;
    readonly trackSequence: ReadonlyArray<TrackName>;
    readonly animationNames: Record<TrackName, string>;
    readonly cssVariables?: Record<string, number | string>;
    readonly propertyDeclarations?: ReadonlyArray<string>;
};

const buildEffectEvaluator = <
    TrackName extends string,
    PropertyName extends string,
    Context,
>(
    config: EffectBuilderConfig<TrackName, PropertyName, Context>
): EffectEvaluator<TrackName, PropertyName> =>
    createEffectAnimationEvaluator(config.spec, config.trackSequence);

export const createEffectDefinition = <
    TrackName extends string,
    PropertyName extends string,
    Context,
>(
    config: EffectBuilderConfig<TrackName, PropertyName, Context>
): EffectDefinition<TrackName, PropertyName, Context> => {
    const evaluator = buildEffectEvaluator(config);

    const createPropertyFormatters = (context: Context) =>
        buildPropertyFormatters(config, context);

    const createKeyframes = (context: Context) =>
        createEffectCssKeyframes({
            spec: config.spec,
            animationNames: config.animationNames,
            propertyFormatters: createPropertyFormatters(context),
            propertyDeclarations: config.propertyDeclarations,
            samplePropertyTimeline: evaluator.samplePropertyTimeline,
        });

    const createAnimationStyle = (elapsedSeconds = 0): CssAnimationStyle =>
        createEffectCssAnimationStyle(
            {
                spec: config.spec,
                trackSequence: config.trackSequence,
                animationNames: config.animationNames,
                getAnimationDelays: evaluator.getAnimationDelays,
                cssVariables: config.cssVariables,
            },
            elapsedSeconds
        );

    return {
        ...evaluator,
        createPropertyFormatters,
        createKeyframes,
        createAnimationStyle,
        spec: config.spec,
        trackSequence: config.trackSequence,
        animationNames: config.animationNames,
        cssVariables: config.cssVariables,
        propertyDeclarations: config.propertyDeclarations,
    };
};
