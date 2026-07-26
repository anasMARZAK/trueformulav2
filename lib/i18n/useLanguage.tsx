'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en, type Dictionary } from './dictionaries/en';
import { fr } from './dictionaries/fr';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  locale: Language;
  setLanguage: (lang: Language) => void;
  setLocale: (loc: Language) => void;
  t: Dictionary;
  isHydrated: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'proteinshop_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (savedLang && (savedLang === 'en' || savedLang === 'fr')) {
        setLanguageState(savedLang);
      } else {
        const browserLang = navigator.language.slice(0, 2).toLowerCase();
        if (browserLang === 'fr') {
          setLanguageState('fr');
        }
      }
    } catch {
      // Fallback to 'en' if localStorage is unavailable
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors
    }
  };

  const setLocale = setLanguage;
  const dictionary = language === 'fr' ? fr : en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        locale: language,
        setLanguage,
        setLocale,
        t: dictionary,
        isHydrated,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
