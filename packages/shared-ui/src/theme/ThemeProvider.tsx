// src/theme/ThemeProvider.tsx
import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from 'react';
import { Platform } from 'react-native';
import { Theme, themesByCategory } from './themes';
import { COLORS } from '../constants/colors';
import { getItem, setItem } from '../utils/storageUtil';

export type ColorKey = keyof Theme['colors'];

type ThemeContextValue = {
    theme: Theme;
    customTheme: Theme;
    setThemeByName: (name: string) => void;
    updateCustomThemeName: (name: string) => void;
    updateCustomThemeColor: (key: ColorKey, value: string) => void;
    applyCustom: () => void;
};

const defaultTheme: Theme = { name: 'Nexus Original', colors: COLORS };
const defaultCustomTheme: Theme = { name: 'Custom Theme', colors: COLORS };

export const ThemeContext = createContext<ThemeContextValue>({
    theme: defaultTheme,
    customTheme: defaultCustomTheme,
    setThemeByName: () => {},
    updateCustomThemeName: () => {},
    updateCustomThemeColor: () => {},
    applyCustom: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
    const [customTheme, setCustomTheme] = useState<Theme>(defaultCustomTheme);

    // on mount, load both selected theme and any saved custom-theme
    useEffect(() => {
        void (async () => {
            const stored = await getItem('nexus-theme');
            if (stored) {
                const { category, name } = JSON.parse(stored);
                if (category === 'Custom') {
                    const saved = await getItem('custom-theme');
                    if (saved) {
                        const parsed: Theme = JSON.parse(saved);
                        setCustomTheme(parsed);
                        setTheme(parsed);
                        return;
                    }
                }
                const found =
                    themesByCategory[category]?.find((t) => t.name === name) ??
                    defaultTheme;
                setTheme(found);
            }
        })();
    }, []);

    const setThemeByName = (name: string) => {
        if (name === customTheme.name) {
            setTheme(customTheme);
            void setItem(
                'nexus-theme',
                JSON.stringify({ category: 'Custom', name })
            );
            return;
        }
        for (const cat of Object.keys(themesByCategory)) {
            const found = themesByCategory[cat].find((t) => t.name === name);
            if (found) {
                setTheme(found);
                void setItem(
                    'nexus-theme',
                    JSON.stringify({ category: cat, name })
                );
                return;
            }
        }
    };

    const updateCustomThemeName = (newName: string) => {
        const updated = { ...customTheme, name: newName };
        setCustomTheme(updated);
        void setItem('custom-theme', JSON.stringify(updated));
    };

    const updateCustomThemeColor = (key: ColorKey, value: string) => {
        const updatedColors = { ...customTheme.colors, [key]: value };
        const updated = { ...customTheme, colors: updatedColors };

        setCustomTheme(updated);
        void setItem('custom-theme', JSON.stringify(updated));

        if (theme.name === customTheme.name) {
            setTheme(updated);
            void setItem(
                'nexus-theme',
                JSON.stringify({ category: 'Custom', name: updated.name })
            );
        }
    };

    const applyCustom = () => {
        // leave the custom name alone, but overwrite the colors from the current 'theme'
        const merged: Theme = {
            name: customTheme.name,
            colors: { ...theme.colors },
        };
        // persist custom palette
        setCustomTheme(merged);
        void setItem('custom-theme', JSON.stringify(merged));
        // make it the active theme
        setTheme(merged);
        void setItem(
            'nexus-theme',
            JSON.stringify({ category: 'Custom', name: merged.name })
        );
    };

    // sync CSS vars on web
    useEffect(() => {
        if (Platform.OS === 'web') {
            Object.entries(theme.colors).forEach(([k, v]) =>
                document.documentElement.style.setProperty(`--${k}`, v)
            );
        }
    }, [theme]);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                customTheme,
                setThemeByName,
                updateCustomThemeName,
                updateCustomThemeColor,
                applyCustom,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
