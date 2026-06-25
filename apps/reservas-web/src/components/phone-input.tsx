"use client";

import { useEffect, useRef, useState } from "react";
import {
  PHONE_COUNTRIES,
  PHONE_COUNTRY_GROUPS,
  PHONE_PRIORITY_COUNTRIES,
  PHONE_SIMPLE_COUNTRIES,
  normalizePhoneSearch,
  normalizePhoneValue,
  splitPhoneNumber,
  type PhoneCountry,
} from "@/lib/phone";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  mode?: "simple" | "searchable";
}

export function PhoneInput({
  id,
  value,
  onChange,
  error,
  placeholder = "600 000 000",
  disabled = false,
  className,
  mode = "simple",
}: Props) {
  const initial = splitPhoneNumber(value);
  const [countryCode, setCountryCode] = useState(initial.country.code);
  const [nationalNumber, setNationalNumber] = useState(initial.nationalNumber);

  useEffect(() => {
    const next = splitPhoneNumber(value, countryCode);
    setCountryCode(next.country.code);
    setNationalNumber(next.nationalNumber);
  }, [value, countryCode]);

  function handleCountryChange(nextCountryCode: string) {
    setCountryCode(nextCountryCode);
    onChange(nationalNumber.trim() ? normalizePhoneValue(nationalNumber, nextCountryCode) : "");
  }

  function handleNumberChange(nextNationalNumber: string) {
    setNationalNumber(nextNationalNumber);
    onChange(nextNationalNumber.trim() ? normalizePhoneValue(nextNationalNumber, countryCode) : "");
  }

  const borderClass = error
    ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500"
    : "border-cream-300 focus-within:border-brand-700 focus-within:ring-brand-700";

  return (
    <div className={className}>
      <div
        className={[
          "grid grid-cols-[8.5rem_minmax(0,1fr)] overflow-hidden rounded-xl border bg-white transition-all focus-within:ring-1 sm:grid-cols-[10.5rem_minmax(0,1fr)]",
          borderClass,
        ].join(" ")}
      >
        <div className="relative border-r border-cream-200 bg-cream-50">
          {mode === "searchable" ? (
            <SearchableCountryPicker
              id={id}
              value={countryCode}
              disabled={disabled}
              onChange={handleCountryChange}
            />
          ) : (
            <SimpleCountryPicker
              id={id}
              value={countryCode}
              disabled={disabled}
              onChange={handleCountryChange}
            />
          )}
        </div>

        <input
          aria-label="Número de teléfono"
          type="tel"
          value={nationalNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={24}
          className="block min-w-0 w-full px-3 py-2.5 text-sm tabular-nums text-brand-900 outline-none placeholder:text-brand-800/25 sm:py-3"
        />
      </div>
    </div>
  );
}

function SimpleCountryPicker({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-full w-full appearance-none bg-transparent px-3 py-2.5 pr-8 text-sm font-medium tabular-nums text-brand-900 outline-none sm:py-3"
      >
        {PHONE_SIMPLE_COUNTRIES.map((country) => (
          <option key={`${country.code}-${country.dialCode}`} value={country.code}>
            {country.flag} {country.dialCode} {country.code}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-800/35" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </>
  );
}

function SearchableCountryPicker({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = PHONE_COUNTRIES.find((country) => country.code === value) ?? PHONE_COUNTRIES[0]!;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const normalizedQuery = normalizePhoneSearch(query);
  const filteredCountries = normalizedQuery
    ? PHONE_COUNTRIES.filter((country) => {
        const haystack = `${country.name} ${country.code} ${country.dialCode} ${country.region}`;
        return normalizePhoneSearch(haystack).includes(normalizedQuery);
      })
    : PHONE_COUNTRIES;

  const frequentCountries = PHONE_PRIORITY_COUNTRIES.filter((country) =>
    filteredCountries.some((entry) => entry.code === country.code),
  );

  const groupedCountries = PHONE_COUNTRY_GROUPS
    .map((group) => ({
      ...group,
      countries: group.countries.filter((country) => filteredCountries.some((entry) => entry.code === country.code)),
    }))
    .filter((group) => group.countries.length > 0);

  function handleSelect(country: PhoneCountry) {
    onChange(country.code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative h-full">
      <button
        id={id}
        type="button"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        className="flex h-full w-full items-center gap-2 bg-transparent px-3 py-2.5 text-left text-sm text-brand-900 outline-none sm:py-3"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="min-w-0 flex-1 truncate font-medium tabular-nums">{selected.dialCode}</span>
        <svg className="h-4 w-4 shrink-0 text-brand-800/35" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Cerrar selector de país"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
            className="absolute inset-0 bg-brand-900/20"
          />

          <div className="absolute left-1/2 top-24 w-[min(30rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-2xl">
            <div className="border-b border-cream-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Selecciona prefijo</p>
                  <p className="text-xs text-brand-800/45">Europa, América, Asia y Oceanía</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="rounded-full p-1 text-brand-800/45 transition-colors hover:bg-cream-100 hover:text-brand-900"
                  aria-label="Cerrar"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar país o prefijo"
                className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm text-brand-900 outline-none transition-all placeholder:text-brand-800/25 focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
              />
            </div>

            <div className="max-h-[min(70vh,32rem)] overflow-y-auto p-2">
              {frequentCountries.length > 0 && (
                <CountrySection
                  title="Frecuentes"
                  countries={frequentCountries}
                  selectedCode={selected.code}
                  onSelect={handleSelect}
                />
              )}

              {groupedCountries.map((group) => (
                <CountrySection
                  key={group.region}
                  title={group.label}
                  countries={group.countries}
                  selectedCode={selected.code}
                  onSelect={handleSelect}
                />
              ))}

              {groupedCountries.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-brand-800/35">
                  No hay países que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CountrySection({
  title,
  countries,
  selectedCode,
  onSelect,
}: {
  title: string;
  countries: PhoneCountry[];
  selectedCode: string;
  onSelect: (country: PhoneCountry) => void;
}) {
  return (
    <div className="pb-2">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-800/35">
        {title}
      </p>
      <div className="space-y-1">
        {countries.map((country) => {
          const isSelected = country.code === selectedCode;
          return (
            <button
              key={country.code}
              type="button"
              onClick={() => onSelect(country)}
              className={[
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                isSelected ? "bg-cream-100 text-brand-900" : "text-brand-900 hover:bg-cream-50",
              ].join(" ")}
            >
              <span className="text-base leading-none">{country.flag}</span>
              <span className="min-w-0 flex-1 truncate">{country.name}</span>
              <span className="shrink-0 font-medium tabular-nums text-brand-800/55">{country.dialCode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
