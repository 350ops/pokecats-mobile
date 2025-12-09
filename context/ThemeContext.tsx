import { Colors } from '@/constants/Colors';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';

interface ThemeContextType {
    isDark: boolean;
    colorScheme: ColorSchemeName;
    colors: typeof Colors.light | typeof Colors.dark;
}

const ThemeContext = createContext<ThemeContextType>({
    isDark: true,
    colorScheme: 'dark',
    colors: Colors.dark,
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [colorScheme, setColorScheme] = useState<ColorSchemeName>(systemColorScheme);

    // Listen for appearance changes from system
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
            setColorScheme(newColorScheme);
        });
        return () => subscription.remove();
    }, []);

    // Sync with hook value when it changes
    useEffect(() => {
        setColorScheme(systemColorScheme);
    }, [systemColorScheme]);

    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    return (
        <ThemeContext.Provider value={{ isDark, colorScheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}
