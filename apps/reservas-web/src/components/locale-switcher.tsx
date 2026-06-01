"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/context";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/translations";

const LOCALES: Record<Locale, { short: string; label: string; flag: string }> = {
  es: { short: "ES", label: "Español", flag: "🇪🇸" },
  en: { short: "EN", label: "English", flag: "🇬🇧" },
  pt: { short: "PT", label: "Português", flag: "🇵🇹" },
  fr: { short: "FR", label: "Français", flag: "🇫🇷" },
  de: { short: "DE", label: "Deutsch", flag: "🇩🇪" },
  it: { short: "IT", label: "Italiano", flag: "🇮🇹" },
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALES[locale];

  useEffect(() => {
    function closeIfOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", closeIfOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeIfOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Idioma de la interfaz"
        className="inline-flex min-w-[184px] items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-[0_16px_36px_rgba(16,52,41,0.12)] backdrop-blur transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_20px_44px_rgba(16,52,41,0.16)] focus:outline-none focus:ring-2 focus:ring-brand-700/20"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-base text-white">
          {current.flag}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-800/38">
            Translate
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-brand-900">
            {current.label}
          </span>
        </span>
        <span className="rounded-full bg-cream-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-800/55">
          {current.short}
        </span>
        <svg className={["h-4 w-4 shrink-0 text-brand-800/42 transition-transform duration-200", open ? "rotate-180" : ""].join(" ")} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Seleccionar idioma"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[240px] overflow-hidden rounded-3xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,244,238,0.98))] p-2 shadow-[0_28px_60px_rgba(16,52,41,0.2)] backdrop-blur-xl"
        >
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-800/38">
              Language
            </span>
            <span className="text-[10px] font-medium text-brand-800/45">
              {SUPPORTED_LOCALES.length} options
            </span>
          </div>
          <div className="space-y-1">
            {SUPPORTED_LOCALES.map((option) => {
              const entry = LOCALES[option];
              const selected = option === locale;

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setLocale(option);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-150",
                    selected ? "bg-brand-900 text-white shadow-[0_10px_24px_rgba(16,52,41,0.22)]" : "text-brand-900 hover:bg-white/95",
                  ].join(" ")}
                >
                  <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg", selected ? "bg-white/14" : "bg-cream-100"].join(" ")}>
                    {entry.flag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{entry.label}</span>
                    <span className={["block text-xs", selected ? "text-white/70" : "text-brand-800/45"].join(" ")}>
                      {entry.short}
                    </span>
                  </span>
                  {selected ? (
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
