"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { type Locale, SUPPORTED_LOCALES, getTranslation, type TranslationKey } from "./translations";

interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "es",
  t: (key) => getTranslation(key, "es"),
});

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
    setLocale(detectBrowserLocale());
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getTranslation(key, locale),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
