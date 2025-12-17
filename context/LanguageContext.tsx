import { en, es, Translations } from '@/locales';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'es';

const LANGUAGE_KEY = 'pokecats_language';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved language preference on mount
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
                if (saved === 'en' || saved === 'es') {
                    setLanguageState(saved);
                }
            } catch (error) {
                console.log('Failed to load language preference');
            } finally {
                setIsLoaded(true);
            }
        };
        loadLanguage();
    }, []);

    // Set language and persist to storage
    const setLanguage = useCallback(async (lang: Language) => {
        setLanguageState(lang);
        try {
            await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
        } catch (error) {
            console.log('Failed to save language preference');
        }
    }, []);

    // Get translations based on current language
    const t = language === 'es' ? es : en;

    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
