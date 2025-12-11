import { Colors } from '@/constants/Colors';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
    isDark: boolean;
    colorScheme: ColorSchemeName;
    colors: typeof Colors.light | typeof Colors.dark;
    preference: ThemePreference;
    setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDark: true,
    colorScheme: 'dark',
    colors: Colors.dark,
    preference: 'system',
    setPreference: () => undefined,
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [systemPreference, setSystemPreference] = useState<ColorSchemeName>(systemColorScheme);
    const [preference, setPreference] = useState<ThemePreference>('system');

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
            setSystemPreference(newColorScheme);
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        setSystemPreference(systemColorScheme);
    }, [systemColorScheme]);

    const resolvedScheme = preference === 'system' ? systemPreference ?? 'light' : preference;
    const isDark = resolvedScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    return (
        <ThemeContext.Provider
            value={{
                isDark,
                colorScheme: resolvedScheme,
                colors,
                preference,
                setPreference,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}
