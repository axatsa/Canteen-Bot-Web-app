// Language Context for Mini App localization

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey, getTranslation } from '@/data/locales';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('ru');

    useEffect(() => {
        // Try to get language from Telegram WebApp or URL params
        const detectLanguage = (): Language => {
            // Check URL params first (passed from bot)
            const urlParams = new URLSearchParams(window.location.search);
            const langParam = urlParams.get('lang');
            if (langParam === 'ru' || langParam === 'uz') {
                return langParam;
            }

            // Check Telegram WebApp initDataUnsafe
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.initDataUnsafe?.user?.language_code) {
                const tgLang = tg.initDataUnsafe.user.language_code;
                // Map telegram language codes to our supported languages
                if (tgLang === 'uz' || tgLang.startsWith('uz')) {
                    return 'uz';
                }
            }

            // Check localStorage for saved preference
            const saved = localStorage.getItem('optimizer_language');
            if (saved === 'ru' || saved === 'uz') {
                return saved;
            }

            // Default to Russian
            return 'ru';
        };

        const detectedLang = detectLanguage();
        setLanguage(detectedLang);
        localStorage.setItem('optimizer_language', detectedLang);
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('optimizer_language', lang);
    };

    const t = (key: TranslationKey): string => {
        return getTranslation(language, key);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
