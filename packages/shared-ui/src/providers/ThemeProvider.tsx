// src/theme/ThemeContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from 'react';
import { Theme, themesByCategory } from '../theme';
import { COLORS } from '../constants/colors';

type ThemeContextValue = {
    theme: Theme;
    setThemeByName: (name: string) => void;
};

const defaultTheme: Theme = { name: 'Default', colors: COLORS };

export const ThemeContext = createContext<ThemeContextValue>({
    theme: defaultTheme,
    setThemeByName: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem('nexus-theme');
        if (stored) {
            const { category, name } = JSON.parse(stored);
            return (
                themesByCategory[category]?.find((t) => t.name === name) ??
                defaultTheme
            );
        }
        return defaultTheme;
    });

    const setThemeByName = (name: string) => {
        for (const cat of Object.keys(themesByCategory)) {
            const found = themesByCategory[cat].find((t) => t.name === name);
            if (found) {
                setTheme(found);
                localStorage.setItem(
                    'nexus-theme',
                    JSON.stringify({ category: cat, name })
                );
                break;
            }
        }
    };

    useEffect(() => {
        // sync CSS vars
        Object.entries(theme.colors).forEach(([key, val]) =>
            document.documentElement.style.setProperty(`--${key}`, val)
        );
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
