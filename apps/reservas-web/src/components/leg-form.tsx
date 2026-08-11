"use client";

import { useMemo } from "react";
import type { StageLeg, Accommodation } from "@/lib/types";
import { useT } from "@/lib/i18n/context";
import { getAccommodationLegIssue, isSpiritualAccommodationLeg } from "@/lib/accommodation-order";
import { AccommodationCombobox } from "./accommodation-combobox";
import { BrandIconTile } from "./brand-icon";

interface Props {
  leg: StageLeg;
  index: number;
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
  allAccommodations,
  canRemove,
  pickupLocked,
  stagesCount = 1,
  onUpdate,
  onRemove,
  errors,
}: Props) {
  const pickupAccommodations = allAccommodations;

  const pickupAccommodation = useMemo(() => {
    const pickupAcc = allAccommodations.find((a) => a.id === leg.pickupAccommodationId);
    return pickupAcc ?? null;
  }, [allAccommodations, leg.pickupAccommodationId]);

  const dropoffAccommodations = useMemo(() => {
    let list = allAccommodations;

    if (pickupAccommodation) {
      list = list.filter((a) => getAccommodationLegIssue(pickupAccommodation, a) !== "reverse_direction");
    }

    return list;
  }, [allAccommodations, pickupAccommodation]);

  const selectedDropoff = useMemo(
    () => allAccommodations.find((a) => a.id === leg.dropoffAccommodationId) ?? null,
    [allAccommodations, leg.dropoffAccommodationId],
  );
  const routeIssue = pickupAccommodation && selectedDropoff
    ? getAccommodationLegIssue(pickupAccommodation, selectedDropoff)
    : null;
  const usesSpiritualRoute = pickupAccommodation && selectedDropoff
    ? isSpiritualAccommodationLeg(pickupAccommodation, selectedDropoff)
    : false;

  function update(field: keyof StageLeg, value: string | number) {
    const next = { ...leg, [field]: value };

    if (field === "bagsCount" && typeof value === "number") {
      next.overweightBagsCount = Math.min(next.overweightBagsCount, value);
    }

    if (field === "pickupAccommodationId" && typeof value === "string") {
      const pickupAcc = allAccommodations.find((a) => a.id === value);
      next.departureTown = pickupAcc?.town ?? "";
    }
    if (field === "dropoffAccommodationId" && typeof value === "string") {
      const dropoffAcc = allAccommodations.find((a) => a.id === value);
      next.arrivalTown = dropoffAcc?.town ?? "";
    }

    onUpdate(next);
  }

  const { t } = useT();
  const prefix = `leg_${index}`;
  const fieldIdPrefix = `leg-${index}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  const minDate = `${yy}-${mm}-${dd}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-100 bg-brand-50/65 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[11px] font-bold text-white">
            {index + 1}
          </span>
          <h4 className="text-sm font-semibold text-brand-900">
            {t("leg.transport")} {index + 1}
          </h4>
          {stagesCount > 1 && (
            <span className="rounded-full bg-gold-100 px-2 py-1 text-[10px] font-bold text-gold-800">
              {stagesCount} {t("leg.stages")}
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="min-h-10 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            {t("leg.delete")}
          </button>
        )}
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {/* Fecha */}
        <Field htmlFor={`${fieldIdPrefix}-date`} label={t("leg.date")} required error={errors[`${prefix}_date`]}>
          <input
            id={`${fieldIdPrefix}-date`}
            name={`leg-${index}-date`}
            type="date"
            value={leg.serviceDate}
            min={minDate}
            onChange={(e) => update("serviceDate", e.target.value)}
            aria-invalid={errors[`${prefix}_date`] ? "true" : "false"}
            autoComplete="off"
            className={selectClass(errors[`${prefix}_date`])}
          />
        </Field>

        {/* Route block — recogida → entrega con conector visual */}
        <div className="relative rounded-xl bg-cream-50/75 px-3.5 py-4 sm:px-4">
          <div className="absolute bottom-[4.25rem] left-[27px] top-[2.25rem] w-px bg-brand-200" aria-hidden="true" />

          <div className="space-y-5">
            {/* Recogida */}
            <div className="relative">
              <div className="flex items-start gap-3">
                <div className="z-10 mt-0.5 shrink-0">
                  <BrandIconTile name="location" size="sm" />
                </div>
                <div className="min-w-0 w-full space-y-2.5">
                  <p className="text-xs font-bold text-sage-800">
                    {t("leg.pickup")}
                  </p>
                  <Field htmlFor={`${fieldIdPrefix}-pickup`} label={t("leg.accommodation")} required error={errors[`${prefix}_pickup`]}>
                    <AccommodationCombobox
                      inputId={`${fieldIdPrefix}-pickup`}
                      value={leg.pickupAccommodationId}
                      accommodations={pickupAccommodations}
                      placeholder={t("leg.searchAccommodation")}
                      error={errors[`${prefix}_pickup`]}
                      onChange={(v) => update("pickupAccommodationId", v)}
                    />
                  </Field>
                  {pickupLocked && leg.pickupAccommodationId && (
                    <p className="flex items-center gap-1.5 text-[11px] text-gold-600/80">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
                      </svg>
                      {t("leg.linked")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Entrega */}
            <div className="relative">
              <div className="flex items-start gap-3">
                <div className="z-10 mt-0.5 shrink-0">
                  <BrandIconTile name="delivery" size="sm" />
                </div>
                <div className="min-w-0 w-full space-y-2.5">
                  <p className="text-xs font-bold text-gold-800">
                    {t("leg.dropoff")}
                  </p>
                  <Field htmlFor={`${fieldIdPrefix}-dropoff`} label={t("leg.accommodation")} required error={errors[`${prefix}_dropoff`]}>
                    <AccommodationCombobox
                      inputId={`${fieldIdPrefix}-dropoff`}
                      value={leg.dropoffAccommodationId}
                      accommodations={dropoffAccommodations}
                      placeholder={t("leg.searchAccommodation")}
                      error={errors[`${prefix}_dropoff`]}
                      onChange={(v) => update("dropoffAccommodationId", v)}
                    />
                  </Field>
                  {usesSpiritualRoute && !errors[`${prefix}_dropoff`] && (
                    <p
                      className={`text-sm font-medium ${routeIssue === "excess_mileage" ? "text-red-700" : "text-amber-700"}`}
                      role="status"
                    >
                      {t(routeIssue === "excess_mileage" ? "val.excessMileage" : "notice.spiritualMileage")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mochilas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Field htmlFor={`${fieldIdPrefix}-bags`} label={t("leg.bags")} required error={errors[`${prefix}_bags`]}>
            <Stepper
              inputId={`${fieldIdPrefix}-bags`}
              label={t("leg.bags")}
              value={leg.bagsCount}
              min={1}
              max={50}
              onChange={(v) => update("bagsCount", v)}
            />
          </Field>

          <Field htmlFor={`${fieldIdPrefix}-overweight`} label={t("leg.overweight")}>
            <Stepper
              inputId={`${fieldIdPrefix}-overweight`}
              label={t("leg.overweight")}
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
  inputId,
  label,
  value,
  min,
  max,
  onChange,
}: {
  inputId: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`${label}: -`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cream-300 bg-white text-lg font-medium text-brand-800/60 transition-colors hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100 disabled:opacity-30"
      >
        -
      </button>
      <input
        id={inputId}
        name={inputId}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
        className="h-11 min-w-0 w-full rounded-xl border border-cream-300 bg-white text-center text-sm font-bold text-brand-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`${label}: +`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cream-300 bg-white text-lg font-medium text-brand-800/60 transition-colors hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

function Field({
  htmlFor,
  label,
  required,
  error,
  children,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-brand-800/65">
        {label}
        {required && <span className="ml-0.5 text-gold-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

function selectClass(error?: string) {
  return [
    "block min-h-11 w-full rounded-xl border bg-white px-3 py-2.5 text-sm transition-[border-color,box-shadow]",
    "text-brand-900 placeholder:text-brand-800/50",
    "focus:outline-none focus:ring-2",
    "disabled:bg-cream-100 disabled:text-brand-800/25",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
      : "border-cream-300 focus:border-brand-700 focus:ring-brand-700/20",
  ].join(" ");
}
