// src/theme/ThemeContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
    useCallback,
} from 'react';
import { Platform } from 'react-native';
import { Theme, themesByCategory } from './themes';

import { COLORS } from '../constants/colors';
import {
    defaultFontConfig,
    availableFontFamilies,
    createFontStyle,
    type FontConfig,
} from '../constants/fonts';
import { getItem, setItem } from '../utils/storageUtil';

type ThemeContextValue = {
    theme: Theme;
    setThemeByName: (name: string) => void;
    setPrimaryFont: (name: string) => void;
    setSecondaryFont: (name: string | undefined) => void;
    setMonospaceFont: (name: string | undefined) => void;
    fontStyles: {
        primary: {
            heading: { fontFamily: string };
            subheading: { fontFamily: string };
            body: { fontFamily: string };
        };
        secondary?: {
            heading: { fontFamily: string };
            subheading: { fontFamily: string };
            body: { fontFamily: string };
        };
        monospace?: {
            heading: { fontFamily: string };
            subheading: { fontFamily: string };
            body: { fontFamily: string };
            code: { fontFamily: string };
        };
    };
};

const defaultTheme: Theme = {
    name: 'Default',
    colors: COLORS,
    fonts: defaultFontConfig,
};

const noop = () => {};

export const ThemeContext = createContext<ThemeContextValue>({
    theme: defaultTheme,
    setThemeByName: noop,
    setPrimaryFont: noop,
    setSecondaryFont: noop,
    setMonospaceFont: noop,
    fontStyles: {
        primary: {
            heading: createFontStyle(defaultFontConfig, {
                weight: 'bold',
                family: 'primary',
            }),
            subheading: createFontStyle(defaultFontConfig, {
                weight: 'semibold',
                family: 'primary',
            }),
            body: createFontStyle(defaultFontConfig, {
                weight: 'regular',
                family: 'primary',
            }),
        },
        secondary: undefined,
        monospace: undefined,
    },
});

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
    const [fontConfig, setFontConfig] = useState<FontConfig>(defaultFontConfig);

    const fontStyles = React.useMemo(() => {
        const createFontEntries = (
            family: keyof FontConfig & ('primary' | 'secondary' | 'monospace')
        ) => ({
            heading: createFontStyle(fontConfig, {
                weight: 'bold',
                family,
            }),
            subheading: createFontStyle(fontConfig, {
                weight: 'semibold',
                family,
            }),
            body: createFontStyle(fontConfig, {
                weight: 'regular',
                family,
            }),
        });

        const primary = createFontEntries('primary');
        const secondary = fontConfig.secondary
            ? createFontEntries('secondary')
            : undefined;
        const monospace = fontConfig.monospace
            ? {
                  ...createFontEntries('monospace'),
                  code: createFontStyle(fontConfig, {
                      weight: 'regular',
                      family: 'monospace',
                  }),
              }
            : undefined;

        return {
            primary,
            secondary,
            monospace,
        };
    }, [fontConfig]);

    useEffect(() => {
        void (async () => {
            const stored = await getItem('nexus-theme');
            if (stored) {
                const { category, name } = JSON.parse(stored);
                setTheme(
                    themesByCategory[category]?.find((t) => t.name === name) ??
                        defaultTheme
                );
            }

            const storedFonts = await getItem('nexus-fonts');
            if (storedFonts) {
                const {
                    primary,
                    secondary,
                    monospace,
                }: {
                    primary?: string;
                    secondary?: string;
                    monospace?: string;
                } = JSON.parse(storedFonts);

                const resolveFont = (name: string | undefined) =>
                    name
                        ? availableFontFamilies.find((f) => f.name === name)
                              ?.family
                        : undefined;

                const primaryFamily = resolveFont(primary);
                const secondaryFamily = resolveFont(secondary);
                const monospaceFamily = resolveFont(monospace);

                setFontConfig({
                    primary: primaryFamily ?? defaultFontConfig.primary,
                    secondary: secondaryFamily ?? defaultFontConfig.secondary,
                    monospace: monospaceFamily ?? defaultFontConfig.monospace,
                });
            }
        })();
    }, []); // Only run once on mount

    const setThemeByName = useCallback((name: string) => {
        for (const cat of Object.keys(themesByCategory)) {
            const found = themesByCategory[cat].find((t) => t.name === name);
            if (found) {
                setTheme(found);
                void setItem(
                    'nexus-theme',
                    JSON.stringify({ category: cat, name })
                );
                break;
            }
        }
    }, []);

    const setPrimaryFont = useCallback((name: string) => {
        const fontFamily = availableFontFamilies.find(
            (f) => f.name === name
        )?.family;
        if (fontFamily) {
            setFontConfig((prev) => ({ ...prev, primary: fontFamily }));
            void (async () => {
                const stored = await getItem('nexus-fonts');
                const current = stored ? JSON.parse(stored) : {};
                void setItem(
                    'nexus-fonts',
                    JSON.stringify({ ...current, primary: name })
                );
            })();
        }
    }, []);

    const setSecondaryFont = useCallback((name: string | undefined) => {
        const fontFamily = availableFontFamilies.find(
            (f) => f.name === name
        )?.family;
        setFontConfig((prev) => ({
            ...prev,
            secondary: name ? fontFamily : undefined,
        }));
        void (async () => {
            const stored = await getItem('nexus-fonts');
            const current = stored ? JSON.parse(stored) : {};
            void setItem(
                'nexus-fonts',
                JSON.stringify({ ...current, secondary: name })
            );
        })();
    }, []);

    const setMonospaceFont = useCallback((name: string | undefined) => {
        const fontFamily = availableFontFamilies.find(
            (f) => f.name === name
        )?.family;
        setFontConfig((prev) => ({
            ...prev,
            monospace: name ? fontFamily : undefined,
        }));
        void (async () => {
            const stored = await getItem('nexus-fonts');
            const current = stored ? JSON.parse(stored) : {};
            void setItem(
                'nexus-fonts',
                JSON.stringify({ ...current, monospace: name })
            );
        })();
    }, []);

    useEffect(() => {
        // sync CSS vars
        if (Platform.OS === 'web') {
            Object.entries(theme.colors).forEach(([key, val]) =>
                document.documentElement.style.setProperty(`--${key}`, val)
            );
        }
    }, [theme]);

    const themeWithFont = React.useMemo(
        () => ({ ...theme, fonts: fontConfig }),
        [theme, fontConfig]
    );

    const contextValue = React.useMemo(
        () => ({
            theme: themeWithFont,
            setThemeByName,
            setPrimaryFont,
            setSecondaryFont,
            setMonospaceFont,
            fontStyles,
        }),
        [
            themeWithFont,
            setThemeByName,
            setPrimaryFont,
            setSecondaryFont,
            setMonospaceFont,
            fontStyles,
        ]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
