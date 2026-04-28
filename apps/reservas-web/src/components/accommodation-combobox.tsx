"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Accommodation } from "@/lib/types";
import { useT } from "@/lib/i18n/context";

interface Props {
  value: string;
  accommodations: Accommodation[];
  placeholder: string;
  disabled?: boolean;
  error?: string;
  onChange: (id: string) => void;
}

export function AccommodationCombobox({
  value,
  accommodations,
  placeholder,
  disabled,
  error,
  onChange,
}: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = accommodations.find((a) => a.id === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return accommodations;
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return accommodations.filter((a) => {
      const strip = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return (
        strip(a.display_name).includes(q) ||
        strip(a.name).includes(q) ||
        (a.town && strip(a.town).includes(q)) ||
        (a.address && strip(a.address).includes(q))
      );
    });
  }, [accommodations, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [open]);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function handleFocus() {
    if (!disabled) {
      setOpen(true);
      setQuery("");
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
  }

  const borderCls = error
    ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500"
    : "border-cream-300 focus-within:border-brand-700 focus-within:ring-brand-700";

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition-all focus-within:ring-1 sm:py-3 ${borderCls} ${disabled ? "bg-cream-100/80" : ""}`}
      >
        <svg
          className="h-4 w-4 shrink-0 text-brand-800/25"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={open ? query : selected?.display_name ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={disabled ? t("combo.selectFirst") : placeholder}
          disabled={disabled}
          className="w-full border-0 bg-transparent text-sm text-brand-900 placeholder:text-brand-800/25 focus:outline-none disabled:text-brand-800/25"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-full p-1 text-brand-800/25 transition-colors hover:bg-cream-200 hover:text-brand-800/50"
            aria-label="Limpiar"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {selected && !open && (
        <>
          <p className="mt-1 truncate pl-1 text-[11px] text-brand-800/35">
            {selected.town ? `${selected.town}` : ""}
            {selected.address ? ` · ${selected.address}` : ""}
          </p>
          {selected.reservation_notes && (
            <div className="mt-1.5 rounded-lg border border-gold-300/60 bg-gradient-to-r from-gold-50 to-amber-50/50 px-3 py-2">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="whitespace-pre-line text-[11px] leading-relaxed text-gold-900/80">
                  {selected.reservation_notes}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {open && !disabled && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-cream-300/80 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-brand-800/30">
              {t("combo.noResults")}
            </div>
          ) : (
            filtered.map((a) => {
              const isSelected = a.id === value;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSelect(a.id)}
                  className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-cream-100 active:bg-cream-200 ${isSelected ? "bg-cream-100" : ""}`}
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-800/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-900">{a.display_name}</p>
                    {a.town && <p className="truncate text-[11px] text-brand-800/35">{a.town}</p>}
                    {a.reservation_notes && (
                      <div className="mt-1 rounded-md border border-gold-200/60 bg-gold-50/50 px-2 py-1.5">
                        <p className="text-[10px] font-bold uppercase text-gold-700/70">{t("combo.importantInfo")}</p>
                        <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-gold-900/80">{a.reservation_notes}</p>
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-900" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
