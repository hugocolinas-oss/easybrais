"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { type Locale, SUPPORTED_LOCALES, getTranslation, type TranslationKey } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "es",
  setLocale: () => {},
  t: (key) => getTranslation(key, "es"),
});

const LOCALE_STORAGE_KEY = "easybrais-locale";

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "es";
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    const code = lang.split("-")[0]?.toLowerCase() as Locale;
    if (SUPPORTED_LOCALES.includes(code)) return code;
  }
  return "es";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) {
      setLocale(saved as Locale);
      return;
    }
    setLocale(detectBrowserLocale());
  }, []);

  const updateLocale = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getTranslation(key, locale),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: updateLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
