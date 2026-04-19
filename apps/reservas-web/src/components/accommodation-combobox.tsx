"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Accommodation } from "@/lib/types";

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = accommodations.find((a) => a.id === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return accommodations;
    const q = query.toLowerCase();
    return accommodations.filter(
      (a) =>
        a.display_name.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.town?.toLowerCase().includes(q) ||
        a.address?.toLowerCase().includes(q),
    );
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
          placeholder={disabled ? "Selecciona primero la etapa" : placeholder}
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
        <p className="mt-1 truncate pl-1 text-[11px] text-brand-800/35">
          {selected.town ? `${selected.town}` : ""}
          {selected.address ? ` · ${selected.address}` : ""}
        </p>
      )}

      {open && !disabled && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-cream-300/80 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-brand-800/30">
              No se encontraron alojamientos
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
                    {a.reservation_notes && <p className="mt-0.5 truncate text-[10px] text-gold-600/60">{a.reservation_notes}</p>}
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
