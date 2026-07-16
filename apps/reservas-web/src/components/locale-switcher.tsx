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

export function LocaleSwitcher({ tone = "dark" }: { tone?: "light" | "dark" }) {
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
        className={[
          "inline-flex h-9 items-center gap-2 rounded-md border px-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500/40",
          tone === "light"
            ? "border-brand-900/20 bg-transparent text-brand-900 hover:bg-brand-900/[.04]"
            : "border-white/[.12] bg-white/[.08] text-white hover:bg-white/[.13]",
        ].join(" ")}
      >
        <span className="text-sm" aria-hidden="true">{current.flag}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{current.short}</span>
        <svg className={["h-3.5 w-3.5 shrink-0 opacity-55 transition-transform duration-200", open ? "rotate-180" : ""].join(" ")} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Seleccionar idioma"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[220px] overflow-hidden rounded-xl border border-cream-300 bg-white p-1.5 shadow-soft"
        >
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-800/38">
              Idioma
            </span>
            <span className="text-[10px] font-medium text-brand-800/45">
              {SUPPORTED_LOCALES.length} opciones
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
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150",
                    selected ? "bg-brand-900 text-white" : "text-brand-900 hover:bg-cream-100",
                  ].join(" ")}
                >
                  <span className="text-lg" aria-hidden="true">
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
