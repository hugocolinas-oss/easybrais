"use client";

import { useMemo } from "react";
import type { StageLeg, Accommodation } from "@/lib/types";
import { AccommodationCombobox } from "./accommodation-combobox";

interface Props {
  leg: StageLeg;
  index: number;
  towns: string[];
  allAccommodations: Accommodation[];
  canRemove: boolean;
  pickupLocked?: boolean;
  stagesCount?: number;
  onUpdate: (leg: StageLeg) => void;
  onRemove: () => void;
  errors: Record<string, string>;
}

export function LegForm({
  leg,
  index,
  towns,
  allAccommodations,
  canRemove,
  pickupLocked,
  stagesCount = 1,
  onUpdate,
  onRemove,
  errors,
}: Props) {
  const pickupAccommodations = useMemo(
    () =>
      leg.departureTown
        ? allAccommodations.filter(
            (a) => a.town?.trim().toLowerCase() === leg.departureTown.trim().toLowerCase(),
          )
        : allAccommodations,
    [allAccommodations, leg.departureTown],
  );

  const dropoffAccommodations = useMemo(
    () =>
      leg.arrivalTown
        ? allAccommodations.filter(
            (a) => a.town?.trim().toLowerCase() === leg.arrivalTown.trim().toLowerCase(),
          )
        : allAccommodations,
    [allAccommodations, leg.arrivalTown],
  );

  function update(field: keyof StageLeg, value: string | number) {
    const next = { ...leg, [field]: value };

    if (field === "bagsCount" && typeof value === "number") {
      next.overweightBagsCount = Math.min(next.overweightBagsCount, value);
    }

    if (field === "departureTown") {
      next.pickupAccommodationId = "";
    }
    if (field === "arrivalTown") {
      next.dropoffAccommodationId = "";
    }

    onUpdate(next);
  }

  const prefix = `leg_${index}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0] ?? "";

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-300/80 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cream-200/60 bg-cream-50 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-900 text-[10px] font-bold text-white">
            {index + 1}
          </span>
          <h4 className="text-sm font-semibold text-brand-900">
            Transporte {index + 1}
          </h4>
          {stagesCount > 1 && (
            <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[9px] font-bold text-gold-700">
              {stagesCount} etapas
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            Eliminar
          </button>
        )}
      </div>

      <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">
        {/* Fecha */}
        <Field label="Fecha del servicio" required error={errors[`${prefix}_date`]}>
          <input
            type="date"
            value={leg.serviceDate}
            min={minDate}
            onChange={(e) => update("serviceDate", e.target.value)}
            className={selectClass(errors[`${prefix}_date`])}
          />
        </Field>

        {/* Route block — recogida → entrega con conector visual */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-[19px] top-[52px] bottom-[52px] hidden w-px border-l-2 border-dashed border-brand-900/10 sm:block" aria-hidden="true" />

          <div className="space-y-3 sm:space-y-0">
            {/* Recogida */}
            <div className="relative rounded-xl border border-sage-200/50 bg-gradient-to-br from-sage-50/40 to-white p-3.5 sm:rounded-b-none sm:p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 hidden shrink-0 sm:block">
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-sage-400 bg-white">
                    <span className="h-2 w-2 rounded-full bg-sage-500" />
                  </span>
                </div>
                <div className="w-full space-y-3">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sage-700/80">
                    <span className="h-2 w-2 rounded-full bg-sage-500 sm:hidden" />
                    Recogida
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Localidad de salida">
                      <select
                        value={leg.departureTown}
                        onChange={(e) => update("departureTown", e.target.value)}
                        disabled={pickupLocked}
                        className={selectClass()}
                      >
                        <option value="">Todas las localidades</option>
                        {towns.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Alojamiento" required error={errors[`${prefix}_pickup`]}>
                      <AccommodationCombobox
                        value={leg.pickupAccommodationId}
                        accommodations={pickupAccommodations}
                        placeholder="Busca alojamiento..."
                        error={errors[`${prefix}_pickup`]}
                        onChange={(v) => update("pickupAccommodationId", v)}
                      />
                    </Field>
                  </div>
                  {pickupLocked && leg.pickupAccommodationId && (
                    <p className="flex items-center gap-1.5 text-[11px] text-gold-600/80">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
                      </svg>
                      Vinculado a la entrega anterior
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Arrow divider (mobile) */}
            <div className="flex justify-center py-0.5 sm:hidden" aria-hidden="true">
              <svg className="h-5 w-5 text-brand-900/15" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </div>

            {/* Entrega */}
            <div className="relative rounded-xl border border-gold-200/50 bg-gradient-to-br from-gold-50/30 to-white p-3.5 sm:rounded-t-none sm:border-t-0 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 hidden shrink-0 sm:block">
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-gold-400 bg-white">
                    <span className="h-2 w-2 rounded-full bg-gold-500" />
                  </span>
                </div>
                <div className="w-full space-y-3">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-700/80">
                    <span className="h-2 w-2 rounded-full bg-gold-500 sm:hidden" />
                    Entrega
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Localidad de llegada">
                      <select
                        value={leg.arrivalTown}
                        onChange={(e) => update("arrivalTown", e.target.value)}
                        className={selectClass()}
                      >
                        <option value="">Todas las localidades</option>
                        {towns.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Alojamiento" required error={errors[`${prefix}_dropoff`]}>
                      <AccommodationCombobox
                        value={leg.dropoffAccommodationId}
                        accommodations={dropoffAccommodations}
                        placeholder="Busca alojamiento..."
                        error={errors[`${prefix}_dropoff`]}
                        onChange={(v) => update("dropoffAccommodationId", v)}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mochilas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Field label="Mochilas" required error={errors[`${prefix}_bags`]}>
            <Stepper
              value={leg.bagsCount}
              min={1}
              max={50}
              onChange={(v) => update("bagsCount", v)}
            />
          </Field>

          <Field label="Con sobrepeso (+20 kg)">
            <Stepper
              value={leg.overweightBagsCount}
              min={0}
              max={leg.bagsCount}
              onChange={(v) => update("overweightBagsCount", v)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ───────────────────────────────────────────── */

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cream-300 text-lg text-brand-800/40 transition-colors hover:bg-cream-100 active:bg-cream-200 disabled:opacity-25 sm:h-11 sm:w-11"
      >
        -
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
        className="h-10 w-full rounded-xl border border-cream-300 text-center text-sm font-bold text-brand-900 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700 sm:h-11"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cream-300 text-lg text-brand-800/40 transition-colors hover:bg-cream-100 active:bg-cream-200 disabled:opacity-25 sm:h-11 sm:w-11"
      >
        +
      </button>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-brand-800/40">
        {label}
        {required && <span className="ml-0.5 text-gold-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

function selectClass(error?: string) {
  return [
    "block w-full rounded-xl border bg-white px-3 py-2.5 text-sm transition-all sm:py-3",
    "text-brand-900 placeholder:text-brand-800/25",
    "focus:outline-none focus:ring-1",
    "disabled:bg-cream-100 disabled:text-brand-800/25",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-cream-300 focus:border-brand-700 focus:ring-brand-700",
  ].join(" ");
}
