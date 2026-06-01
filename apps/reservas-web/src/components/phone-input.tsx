"use client";

import { useEffect, useState } from "react";
import { PHONE_COUNTRIES, normalizePhoneValue, splitPhoneNumber } from "@/lib/phone";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  id,
  value,
  onChange,
  error,
  placeholder = "600 000 000",
  disabled = false,
  className,
}: Props) {
  const initial = splitPhoneNumber(value);
  const [countryCode, setCountryCode] = useState(initial.country.code);
  const [nationalNumber, setNationalNumber] = useState(initial.nationalNumber);

  useEffect(() => {
    const next = splitPhoneNumber(value);
    setCountryCode(next.country.code);
    setNationalNumber(next.nationalNumber);
  }, [value]);

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
          "flex overflow-hidden rounded-xl border bg-white transition-all focus-within:ring-1",
          borderClass,
        ].join(" ")}
      >
        <div className="relative min-w-[152px] border-r border-cream-200 bg-cream-50">
          <select
            id={id}
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={disabled}
            className="h-full w-full appearance-none bg-transparent px-3 py-2.5 pr-8 text-sm text-brand-900 outline-none sm:py-3"
          >
            {PHONE_COUNTRIES.map((country) => (
              <option key={`${country.code}-${country.dialCode}`} value={country.code}>
                {country.flag} {country.dialCode} {country.code}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-800/35" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>

        <input
          aria-label="Número de teléfono"
          type="tel"
          value={nationalNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={24}
          className="block min-w-0 flex-1 px-3 py-2.5 text-sm text-brand-900 outline-none placeholder:text-brand-800/25 sm:py-3"
        />
      </div>
    </div>
  );
}
