// src/theme/ThemeContext.tsx
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

type ThemeContextValue = {
    theme: Theme;
    setThemeByName: (name: string) => void;
};

const defaultTheme: Theme = { name: 'Nexus Original', colors: COLORS };

export const ThemeContext = createContext<ThemeContextValue>({
    theme: defaultTheme,
    setThemeByName: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
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
        })();
    });

    const setThemeByName = (name: string) => {
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
    };

    useEffect(() => {
        // sync CSS vars
        if (Platform.OS === 'web') {
            Object.entries(theme.colors).forEach(([key, val]) =>
                document.documentElement.style.setProperty(`--${key}`, val)
            );
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setThemeByName }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
