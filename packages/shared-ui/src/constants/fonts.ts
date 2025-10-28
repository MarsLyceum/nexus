import { Platform } from 'react-native';

export type FontWeight = 'regular' | 'semibold' | 'bold';
export type FontStyle = 'normal' | 'italic';

export type FontFamily = Readonly<{
    regular: string;
    regularItalic: string;
    semibold?: string;
    semiboldItalic?: string;
    bold: string;
    boldItalic: string;
}>;

export type FontConfig = {
    primary: FontFamily;
    secondary?: FontFamily;
    monospace?: FontFamily;
};

const createFontFamily = (variants: {
    readonly regular: string;
    readonly regularItalic: string;
    readonly semibold?: string;
    readonly semiboldItalic?: string;
    readonly bold: string;
    readonly boldItalic: string;
}): FontFamily => variants;

const createRobotoFamily = (): FontFamily =>
    createFontFamily({
        regular: 'Roboto_400Regular',
        regularItalic: 'Roboto_400Regular_Italic',
        semibold: 'Roboto_500Medium',
        semiboldItalic: 'Roboto_500Medium_Italic',
        bold: 'Roboto_700Bold',
        boldItalic: 'Roboto_700Bold_Italic',
    });

const createLatoFamily = (): FontFamily =>
    createFontFamily({
        regular: 'Lato_400Regular',
        regularItalic: 'Lato_400Regular_Italic',
        bold: 'Lato_700Bold',
        boldItalic: 'Lato_700Bold_Italic',
    });

const createSourceCodeProFamily = (): FontFamily =>
    createFontFamily({
        regular: 'SourceCodePro_400Regular',
        regularItalic: 'SourceCodePro_400Regular_Italic',
        semibold: 'SourceCodePro_500Medium',
        semiboldItalic: 'SourceCodePro_500Medium_Italic',
        bold: 'SourceCodePro_700Bold',
        boldItalic: 'SourceCodePro_700Bold_Italic',
    });

const createInterFamily = (): FontFamily =>
    createFontFamily({
        regular: 'Inter_400Regular',
        regularItalic: 'Inter_400Regular_Italic',
        semibold: 'Inter_600SemiBold',
        semiboldItalic: 'Inter_600SemiBold_Italic',
        bold: 'Inter_700Bold',
        boldItalic: 'Inter_700Bold_Italic',
    });

export const defaultFontConfig: FontConfig = {
    primary: createRobotoFamily(),
    secondary: createInterFamily(),
    monospace: createSourceCodeProFamily(),
};

export {
    createRobotoFamily,
    createLatoFamily,
    createSourceCodeProFamily,
    createInterFamily,
};

const getFontVariant = (
    fontFamily: FontFamily,
    weight: FontWeight,
    italic: boolean
): string => {
    const weightMap: Record<FontWeight, keyof FontFamily> = {
        regular: italic ? 'regularItalic' : 'regular',
        semibold: italic ? 'semiboldItalic' : 'semibold',
        bold: italic ? 'boldItalic' : 'bold',
    };

    const key = weightMap[weight];
    const font = fontFamily[key];

    if (font) {
        return font;
    }

    if (weight === 'semibold') {
        return getFontVariant(fontFamily, 'bold', italic);
    }

    return italic ? fontFamily.regularItalic : fontFamily.regular;
};

export const getFontFamily = (
    config: FontConfig,
    options: {
        weight?: FontWeight;
        italic?: boolean;
        family?: 'primary' | 'secondary' | 'monospace';
    } = {}
): string => {
    const { weight = 'regular', italic = false, family = 'primary' } = options;

    if (family === 'monospace') {
        if (!config.monospace) {
            return (
                Platform.select({
                    web: "'Source Code Pro', monospace",
                    default: 'Courier',
                }) ?? 'monospace'
            );
        }

        return getFontVariant(config.monospace, weight, italic);
    }

    const fontFamily =
        family === 'secondary' && config.secondary
            ? config.secondary
            : config.primary;

    return getFontVariant(fontFamily, weight, italic);
};

export const createFontStyle = (
    config: FontConfig,
    options: {
        weight?: FontWeight;
        italic?: boolean;
        family?: 'primary' | 'secondary' | 'monospace';
    } = {}
) => ({
    fontFamily: getFontFamily(config, options),
});

export const sameFontFamily = (
    left: FontFamily | undefined,
    right: FontFamily | undefined
): boolean => {
    if (!left || !right) {
        return false;
    }
    return (
        left.regular === right.regular &&
        left.semibold === right.semibold &&
        left.bold === right.bold
    );
};

export type AvailableFontFamily = {
    name: string;
    family: FontFamily;
};

export const availableFontFamilies: AvailableFontFamily[] = [
    { name: 'Roboto', family: createRobotoFamily() },
    { name: 'Inter', family: createInterFamily() },
    { name: 'Lato', family: createLatoFamily() },
    { name: 'Source Code Pro', family: createSourceCodeProFamily() },
];
