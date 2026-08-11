"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import type { Accommodation, BookingType, StageLeg, BookingFormData } from "@/lib/types";
import { calculatePricing, formatEUR, fmtDateShort, PRICING_RULES, getRealEtapas, getRealEtapasForStages } from "@easybrais/utils";
import { createBooking, type BookingSuccess } from "@/app/actions";
import { useT } from "@/lib/i18n/context";
import { getAccommodationPricingPrefix, getAccommodationPricingStage, isValidAccommodationLeg } from "@/lib/accommodation-order";
import { BookingTypeSelector } from "./booking-type-selector";
import { LegForm } from "./leg-form";
import { CustomerFields } from "./customer-fields";
import { BookingConfirmation } from "./booking-confirmation";
import { BrandIcon, BrandIconTile, type BrandIconName } from "./brand-icon";
import { isPhoneValueValid } from "@/lib/phone";
import { openStripeCheckout } from "@/lib/stripe-checkout-client";

interface Props {
  allAccommodations: Accommodation[];
  onlinePaymentAvailable: boolean;
}

interface LockerSpot {
  id: string;
  name: string;
  address?: string;
  note?: string;
  url: string;
}

interface LockerCity {
  city: string;
  spots: LockerSpot[];
}

const LOCKER_MAP_URLS: Record<string, string> = {
  "6.26": "https://maps.app.goo.gl/uBgedmpFpSdSikVo9?g_st=ic",
  "8.30": "https://maps.app.goo.gl/SxnMeaxuaCPi2vWi9?g_st=ic",
  "8.33": "https://maps.app.goo.gl/oXXTamKnwN4PGoN88?g_st=ic",
  "13.02": "https://maps.app.goo.gl/igtjdgJfRJpzrutk7?g_st=ipc",
  "13.11": "https://maps.app.goo.gl/2fFoZeS95mu1HCBJ8?g_st=ic",
  "13.31": "https://maps.google.com?q=Albergue%20Santiago%20KM0,%20R%C3%BAa%20das%20Carretas,%2011,%2015705%20Santiago%20de%20Compostela,%20A%20Coru%C3%B1a&ftid=0xd2effe210d79ffd:0x14b9efccb0e5552c&hl=es-ES&gl=es&entry=gps&lucs=,47071704&g_st=ic",
  "13.39": "https://maps.app.goo.gl/DfXrJP8bLtqcXcCS7?g_st=ic",
};

const LOCKER_DISPLAY_NAMES: Record<string, string> = {
  "8.30": "GBC Caldas",
  "8.33": "Albergue Urraka",
};

function createLeg(): StageLeg {
  return {
    id: crypto.randomUUID(),
    serviceDate: "",
    departureTown: "",
    pickupAccommodationId: "",
    arrivalTown: "",
    dropoffAccommodationId: "",
    bagsCount: 1,
    overweightBagsCount: 0,
  };
}

const EMPTY_CUSTOMER = {
  fullName: "",
  email: "",
  phone: "",
  language: "es",
  notes: "",
};

function getStagesCount(
  pickupAcc: Accommodation | undefined,
  dropoffAcc: Accommodation | undefined,
): number {
  if (!pickupAcc || !dropoffAcc) return 1;
  const pickupStage = getAccommodationPricingStage(pickupAcc);
  const dropoffStage = getAccommodationPricingStage(dropoffAcc);
  if (pickupStage && dropoffStage) {
    return getRealEtapasForStages(pickupStage, dropoffStage);
  }
  const p = getAccommodationPricingPrefix(pickupAcc);
  const d = getAccommodationPricingPrefix(dropoffAcc);
  if (p === null || d === null) return 1;
  return getRealEtapas(p, d);
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTownLabel(value: string | null | undefined) {
  const cleaned = (value ?? "").replace(/\*/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Otras ubicaciones";
  return cleaned
    .toLocaleLowerCase("es-ES")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("es-ES") + part.slice(1))
    .join(" ");
}

function buildMapsSearchUrl(accommodation: Accommodation) {
  const query = accommodation.address?.trim()
    ? accommodation.address
    : [accommodation.display_name, accommodation.town].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function isLockerAccommodation(accommodation: Accommodation) {
  const haystack = normalizeText([
    accommodation.name,
    accommodation.display_name,
    accommodation.reservation_notes,
  ].filter(Boolean).join(" "));
  return haystack.includes("consigna") || haystack.includes("locker");
}

export function BookingForm({ allAccommodations, onlinePaymentAvailable }: Props) {
  const { t, locale } = useT();
  const [bookingType, setBookingType] = useState<BookingType>("single_stage");
  const [legs, setLegs] = useState<StageLeg[]>([createLeg()]);
  const [customer, setCustomer] = useState({ ...EMPTY_CUSTOMER, language: locale });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("cash");
  const [accommodationPolicyAccepted, setAccommodationPolicyAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<"saving" | "redirecting">("saving");
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingSuccess | null>(null);

  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const autoLanguageRef = useRef(customer.language);
  const customerLanguageTouchedRef = useRef(false);

  useEffect(() => {
    setCustomer((prev) => {
      if (customerLanguageTouchedRef.current) {
        return prev;
      }
      if (prev.language === locale) {
        autoLanguageRef.current = locale;
        return prev;
      }
      autoLanguageRef.current = locale;
      return { ...prev, language: locale };
    });
  }, [locale]);

  const accMap = useMemo(
    () => new Map(allAccommodations.map((a) => [a.id, a])),
    [allAccommodations],
  );

  const lockerCities = useMemo<LockerCity[]>(() => {
    const grouped = new Map<string, LockerCity>();

    allAccommodations
      .filter(isLockerAccommodation)
      .sort((a, b) =>
        `${formatTownLabel(a.town)}-${a.display_name}`.localeCompare(
          `${formatTownLabel(b.town)}-${b.display_name}`,
          "es-ES",
          { numeric: true, sensitivity: "base" },
        ),
      )
      .forEach((accommodation) => {
        const city = formatTownLabel(accommodation.town);
        let bucket = grouped.get(city);
        if (!bucket) {
          bucket = { city, spots: [] };
          grouped.set(city, bucket);
        }
        bucket.spots.push({
          id: accommodation.id,
          name: LOCKER_DISPLAY_NAMES[accommodation.external_code ?? ""] ?? accommodation.display_name,
          address: accommodation.address ?? undefined,
          note: accommodation.reservation_notes ?? undefined,
          url: LOCKER_MAP_URLS[accommodation.external_code ?? ""] ?? buildMapsSearchUrl(accommodation),
        });
      });

    return Array.from(grouped.values());
  }, [allAccommodations]);

  const pricing = useMemo(
    () =>
      calculatePricing(
        legs.map((l) => {
          const pickup = accMap.get(l.pickupAccommodationId);
          const dropoff = accMap.get(l.dropoffAccommodationId);
          const pickupStage = pickup ? getAccommodationPricingStage(pickup) : null;
          const dropoffStage = dropoff ? getAccommodationPricingStage(dropoff) : null;
          const p = pickup ? getAccommodationPricingPrefix(pickup) : null;
          const d = dropoff ? getAccommodationPricingPrefix(dropoff) : null;
          const stages = pickupStage && dropoffStage
            ? getRealEtapasForStages(pickupStage, dropoffStage)
            : p !== null && d !== null ? getRealEtapas(p, d) : 1;
          return {
            bagsCount: l.bagsCount,
            overweightBagsCount: l.overweightBagsCount,
            stagesCount: stages,
            pickupPrefix: p,
            dropoffPrefix: d,
            pickupStage,
            dropoffStage,
          };
        }),
      ),
    [legs, accMap],
  );

  const handleTypeChange = useCallback(
    (type: BookingType) => {
      setBookingType(type);
      setErrors({});

      if (type === "single_stage") {
        setLegs([createLeg()]);
      } else {
        setLegs((prev) => {
          if (prev.length <= 2) {
            const filled = prev.slice(0, 2);
            while (filled.length < 2) filled.push(createLeg());
            return filled;
          }
          return [prev[0] ?? createLeg(), prev[1] ?? createLeg()];
        });
      }
    },
    [],
  );

  function updateLeg(index: number, updated: StageLeg) {
    setLegs((prev) => {
      const next = prev.map((l, i) => (i === index ? updated : l));

      // Sync bag counts across all legs when changed
      const bagsChanged = prev[index]?.bagsCount !== updated.bagsCount;
      const overweightChanged = prev[index]?.overweightBagsCount !== updated.overweightBagsCount;
      if (bagsChanged || overweightChanged) {
        for (let i = 0; i < next.length; i++) {
          const leg = next[i];
          if (i !== index && leg) {
            next[i] = {
              ...leg,
              bagsCount: updated.bagsCount,
              overweightBagsCount: Math.min(updated.overweightBagsCount, updated.bagsCount),
            };
          }
        }
      }

      const pickupChanged = prev[index]?.pickupAccommodationId !== updated.pickupAccommodationId;
      if (pickupChanged && updated.pickupAccommodationId) {
        const newPickupAcc = accMap.get(updated.pickupAccommodationId);
        const at = next[index];
        if (at) next[index] = { ...at, departureTown: newPickupAcc?.town ?? at.departureTown };
        if (newPickupAcc && updated.dropoffAccommodationId) {
          const dropoffAcc = accMap.get(updated.dropoffAccommodationId);
          if (dropoffAcc && !isValidAccommodationLeg(newPickupAcc, dropoffAcc)) {
            const at = next[index];
            if (at) next[index] = { ...at, dropoffAccommodationId: "", arrivalTown: "" };
          }
        }
      }

      const currentDropoff = next[index]?.dropoffAccommodationId ?? "";
      const dropoffChanged = prev[index]?.dropoffAccommodationId !== currentDropoff;
      if (dropoffChanged && currentDropoff && index < next.length - 1) {
        const dropoffAcc = accMap.get(currentDropoff);
        const at = next[index];
        if (at) next[index] = { ...at, arrivalTown: dropoffAcc?.town ?? at.arrivalTown };
        const nextLeg = next[index + 1];
        if (nextLeg) {
          next[index + 1] = {
            ...nextLeg,
            departureTown: dropoffAcc?.town ?? "",
            pickupAccommodationId: currentDropoff,
          };
        }
      }

      const dateChanged = prev[index]?.serviceDate !== updated.serviceDate;
      if (dateChanged && updated.serviceDate && index < next.length - 1) {
        const nextLeg = next[index + 1];
        if (nextLeg && !nextLeg.serviceDate) {
          const d = new Date(updated.serviceDate);
          d.setDate(d.getDate() + 1);
          next[index + 1] = {
            ...nextLeg,
            serviceDate: d.toISOString().slice(0, 10),
          };
        }
      }

      return next;
    });
  }

  function removeLeg(index: number) {
    setLegs((prev) => prev.filter((_, i) => i !== index));
  }

  function addLeg() {
    setLegs((prev) => {
      const lastLeg = prev[prev.length - 1];
      const newLeg = createLeg();
      if (lastLeg?.dropoffAccommodationId) {
        const dropoffAcc = accMap.get(lastLeg.dropoffAccommodationId);
        newLeg.departureTown = dropoffAcc?.town ?? "";
        newLeg.pickupAccommodationId = lastLeg.dropoffAccommodationId;
      }
      if (lastLeg?.arrivalTown) {
        newLeg.departureTown = newLeg.departureTown || lastLeg.arrivalTown;
      }
      return [...prev, newLeg];
    });
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!customer.fullName.trim()) errs.fullName = t("val.required");
    if (!customer.email.trim()) errs.email = t("val.required");
    else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(customer.email))
      errs.email = t("val.invalidEmail");
    if (!customer.phone.trim()) errs.phone = t("val.required");
    else if (!isPhoneValueValid(customer.phone)) errs.phone = t("val.invalidPhone");
    if (!accommodationPolicyAccepted) errs.accommodationPolicy = t("val.accommodationPolicy");

    legs.forEach((leg, i) => {
      const p = `leg_${i}`;
      if (!leg.serviceDate) errs[`${p}_date`] = t("val.selectDate");
      if (!leg.pickupAccommodationId)
        errs[`${p}_pickup`] = t("val.selectPickup");
      if (!leg.dropoffAccommodationId)
        errs[`${p}_dropoff`] = t("val.selectDropoff");
      if (leg.bagsCount < 1) errs[`${p}_bags`] = t("val.min1");
      if (
        leg.pickupAccommodationId &&
        leg.dropoffAccommodationId &&
        leg.pickupAccommodationId === leg.dropoffAccommodationId
      ) {
        errs[`${p}_dropoff`] = t("val.differentDropoff");
      }
      if (leg.pickupAccommodationId && leg.dropoffAccommodationId) {
        const pAcc = accMap.get(leg.pickupAccommodationId);
        const dAcc = accMap.get(leg.dropoffAccommodationId);
        if (pAcc && dAcc && !isValidAccommodationLeg(pAcc, dAcc)) {
          errs[`${p}_dropoff`] = t("val.reverseDirection");
        }
      }
    });

    return errs;
  }

  function focusField(fieldId: string) {
    requestAnimationFrame(() => {
      const element = document.getElementById(fieldId) as HTMLElement | null;
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    });
  }

  function getFirstInvalidFieldId(validationErrors: Record<string, string>): string | null {
    if (validationErrors.accommodationPolicy) return "accommodation-policy";
    if (validationErrors.fullName) return "customer-fullName";
    if (validationErrors.email) return "customer-email";
    if (validationErrors.phone) return "customer-phone";

    for (let index = 0; index < legs.length; index += 1) {
      if (validationErrors[`leg_${index}_date`]) return `leg-${index}-date`;
      if (validationErrors[`leg_${index}_pickup`]) return `leg-${index}-pickup`;
      if (validationErrors[`leg_${index}_dropoff`]) return `leg-${index}-dropoff`;
      if (validationErrors[`leg_${index}_bags`]) return `leg-${index}-bags`;
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const fieldId = getFirstInvalidFieldId(validationErrors);
      if (fieldId) focusField(fieldId);
      return;
    }

    setSubmitting(true);
    setSubmissionStage("saving");

    try {
      const data: BookingFormData = {
        bookingType,
        legs,
        customer,
        paymentMethod,
        accommodationPolicyAccepted,
      };
      const res = await createBooking(data, idempotencyKeyRef.current);

      if (!res.ok) {
        setServerError(res.error);
        return;
      }

      if (paymentMethod === "online" && res.stripeEnabled) {
        setSubmissionStage("redirecting");
        try {
          await openStripeCheckout(res.bookingId, res.bookingCode);
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : t("val.connectionError");
          setResult({ ...res, paymentError: message });
          return;
        }
      }

      setResult(res);
    } catch {
      setServerError(t("val.connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewBooking() {
    setResult(null);
    setLegs([createLeg()]);
    customerLanguageTouchedRef.current = false;
    autoLanguageRef.current = locale;
    setCustomer({ ...EMPTY_CUSTOMER, language: locale });
    setBookingType("single_stage");
    setPaymentMethod("cash");
    setAccommodationPolicyAccepted(false);
    setErrors({});
    setServerError(null);
    idempotencyKeyRef.current = crypto.randomUUID();
  }

  if (result) {
    return <BookingConfirmation result={result} onNewBooking={handleNewBooking} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        {/* Left column — Form */}
        <div className="min-w-0 space-y-8 sm:space-y-10">
          <BookingIntroCard />

          {/* Section 1: Booking Type */}
          <FormSection step={1} title={t("section.type")} subtitle={t("section.type.sub")}>
            <BookingTypeSelector value={bookingType} onChange={handleTypeChange} />
          </FormSection>

          {/* Section 2: Transport Legs */}
          <FormSection step={2} title={t("section.details")} subtitle={t("section.details.sub")}>
            <div className="space-y-4">
              <AccommodationPolicy
                checked={accommodationPolicyAccepted}
                error={errors.accommodationPolicy}
                onChange={(checked) => {
                  setAccommodationPolicyAccepted(checked);
                  if (checked) {
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.accommodationPolicy;
                      return next;
                    });
                  }
                }}
              />
              {bookingType === "multi_stage" && (
                <div className="rounded-xl bg-sage-50 px-4 py-3.5 text-sm text-brand-900 ring-1 ring-inset ring-sage-200/70">
                  <p className="font-semibold text-brand-900">{t("multi.help.title")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-800/70">{t("multi.help.body")}</p>
                </div>
              )}
              {legs.map((leg, i) => {
                const pickup = accMap.get(leg.pickupAccommodationId);
                const dropoff = accMap.get(leg.dropoffAccommodationId);
                const stages = getStagesCount(pickup, dropoff);
                return (
                  <LegForm
                    key={leg.id}
                    leg={leg}
                    index={i}
                    allAccommodations={allAccommodations}
                    canRemove={legs.length > 1}
                    pickupLocked={i > 0 && !!legs[i - 1]?.dropoffAccommodationId}
                    stagesCount={stages}
                    onUpdate={(updated) => updateLeg(i, updated)}
                    onRemove={() => removeLeg(i)}
                    errors={errors}
                  />
                );
              })}

              {bookingType === "multi_stage" && (
                <button
                  type="button"
                  onClick={addLeg}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-transparent px-4 py-3 text-sm font-semibold text-brand-700 transition-[border-color,background-color,color] hover:border-brand-500 hover:bg-brand-50 hover:text-brand-900"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t("leg.add")}
                </button>
              )}
            </div>
          </FormSection>

          {/* Section 3: Customer */}
          <FormSection step={3} title={t("section.customer")} subtitle={t("section.customer.sub")}>
            <div className="rounded-2xl border border-cream-300 bg-white p-4 sm:p-6">
              <CustomerFields
                value={customer}
                onChange={(nextCustomer) => {
                  if (nextCustomer.language !== autoLanguageRef.current) {
                    customerLanguageTouchedRef.current = true;
                  }
                  setCustomer(nextCustomer);
                }}
                errors={errors}
              />
            </div>
          </FormSection>

          <FormSection step={4} title={t("section.payment")} subtitle={t("section.payment.sub")}>
            <PaymentMethodSelector
              value={paymentMethod}
              onlinePaymentAvailable={onlinePaymentAvailable}
              onChange={setPaymentMethod}
            />
          </FormSection>

          {/* Validation errors */}
          {Object.keys(errors).length > 0 && (
            <div role="alert" aria-live="polite" className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50 p-4">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium text-red-700">
                {t("val.checkFields")}
              </p>
            </div>
          )}

          {serverError && (
            <div role="alert" aria-live="polite" className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50 p-4">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium text-red-700">{serverError}</p>
            </div>
          )}

          {/* Mobile summary */}
          <div className="lg:hidden">
            <MobileSummary
              legs={legs}
              pricing={pricing}
              submitting={submitting}
              submissionStage={submissionStage}
              paymentMethod={paymentMethod}
            />
          </div>
        </div>

        {/* Right column — Sticky Summary (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
              {/* Summary header */}
              <div className="flex items-center gap-3 bg-brand-900 px-6 py-5">
                <BrandIconTile name="backpack" size="sm" tone="dark" />
                <div>
                  <h3 className="text-base font-bold text-white">{t("summary.title")}</h3>
                  <p className="mt-1 text-xs text-white/60">{t("summary.review")}</p>
                </div>
              </div>

              {/* Legs list */}
              <div className="divide-y divide-cream-200/60 px-6 py-4">
                {legs.map((leg, i) => {
                  const pickup = accMap.get(leg.pickupAccommodationId);
                  const dropoff = accMap.get(leg.dropoffAccommodationId);
                  const hasData = pickup || dropoff || leg.serviceDate;
                  const stages = getStagesCount(pickup, dropoff);

                  return (
                    <div key={leg.id} className={`${i > 0 ? "pt-3" : ""} ${i < legs.length - 1 ? "pb-3" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gold-500/15 text-[10px] font-bold text-gold-700">
                          {i + 1}
                        </span>
                        <span className="text-xs font-semibold text-brand-900">{t("leg.transport")} {i + 1}</span>
                        {stages > 1 && (
                          <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[9px] font-bold text-gold-700">
                            {stages} {t("leg.stages")}
                          </span>
                        )}
                      </div>
                      {hasData ? (
                        <div className="ml-7 mt-1.5 space-y-1">
                          {pickup && <SummaryRow icon="pickup" label={pickup.display_name} />}
                          {dropoff && <SummaryRow icon="dropoff" label={dropoff.display_name} />}
                          {leg.serviceDate && <SummaryRow icon="date" label={fmtDateShort(leg.serviceDate)} />}
                        </div>
                      ) : (
                        <p className="ml-7 mt-1 text-[11px] italic text-brand-800/25">{t("summary.incomplete")}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t border-cream-200 bg-cream-50 px-6 py-4">
                <div className="flex justify-between text-[13px] text-brand-800/70">
                  <span>{t("summary.luggage")}</span>
                  <span className="font-semibold text-brand-900">
                    {pricing.totalBags} {pricing.totalBags === 1 ? t("summary.backpack") : t("summary.backpacks")}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-[13px] text-brand-800/70">
                  <span>{t("summary.transports")}</span>
                  <span className="font-semibold text-brand-900">{legs.length}</span>
                </div>
                {pricing.totalTransportUnits > pricing.totalBags && (
                  <div className="mt-1 flex justify-between text-[13px] text-brand-800/70">
                    <span>{t("summary.units")}</span>
                    <span className="font-semibold text-gold-700">{pricing.totalTransportUnits}</span>
                  </div>
                )}

                <div className="mt-4 flex items-baseline justify-between border-t border-cream-300/60 pt-4">
                  <span className="text-sm font-bold text-brand-900">{t("summary.total")}</span>
                  <span className="tabular-nums text-3xl font-extrabold tracking-tight text-gold-700">
                    {formatEUR(pricing.totalAmount)}
                  </span>
                </div>

                {pricing.totalBags === 0 && (
                  <p className="mt-2 text-center text-[10px] text-brand-800/30">
                    {t("summary.priceCalc")}
                  </p>
                )}
                {pricing.totalTransportUnits > pricing.totalBags && (
                  <p className="mt-2 text-[11px] leading-relaxed text-brand-800/45">
                    {t("summary.unitsHelp")}
                  </p>
                )}

                <details className="mt-3 group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 text-[11px] font-medium text-brand-800/40 transition-colors hover:text-brand-800/60">
                    <span>{t("summary.breakdown")}</span>
                    <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <PriceBreakdown pricing={pricing} />
                </details>
              </div>

              {/* Submit button */}
              <div className="px-6 pb-5 pt-1">
                <SubmitButton
                  submitting={submitting}
                  submissionStage={submissionStage}
                  paymentMethod={paymentMethod}
                  total={pricing.totalAmount}
                />
              </div>

              {/* Guarantee */}
              <div className="border-t border-cream-200 px-6 py-3">
                <div className="flex items-center gap-2 text-[11px] text-brand-800/35">
                  <BrandIcon name="confirmation" className="h-4 w-4 shrink-0 text-brand-700" />
                  <span>{t("summary.guarantee")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-10">
        <LockerHelp cities={lockerCities} />
      </div>
    </form>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function BookingIntroCard() {
  const { t } = useT();
  return (
    <section className="border-y border-brand-900/10 py-5 sm:py-6">
      <div className="mb-4">
        <h3 className="text-base font-bold text-brand-900">{t("intro.title")}</h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-800/65">{t("intro.subtitle")}</p>
      </div>
      <div className="divide-y divide-brand-900/10">
        <InfoPill title={t("intro.route.title")} body={t("intro.route.body")} icon="route" />
        <InfoPill title={t("intro.price.title")} body={t("intro.price.body")} icon="euro" />
        <InfoPill title={t("intro.payment.title")} body={t("intro.payment.body")} icon="confirmation" />
      </div>
    </section>
  );
}

function AccommodationPolicy({
  checked,
  error,
  onChange,
}: {
  checked: boolean;
  error?: string;
  onChange: (checked: boolean) => void;
}) {
  const { t } = useT();

  return (
    <div className={`rounded-xl border px-4 py-4 ${error ? "border-red-300 bg-red-50" : "border-gold-300 bg-gold-50/70"}`}>
      <p className="text-sm font-bold text-brand-900">{t("accommodation.policy.title")}</p>
      <p className="mt-1 text-sm leading-relaxed text-brand-800/75">
        {t("accommodation.policy.body")} {" "}
        <a href="#consignas" className="font-semibold text-sage-700 underline decoration-sage-300 underline-offset-2">
          {t("accommodation.policy.lockers")}
        </a>
      </p>
      <label htmlFor="accommodation-policy" className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg bg-white/80 px-3 py-3 ring-1 ring-inset ring-brand-900/10">
        <input
          id="accommodation-policy"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "accommodation-policy-error" : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-brand-300 text-sage-600 focus:ring-sage-500"
        />
        <span className="text-sm font-semibold leading-relaxed text-brand-900">
          {t("accommodation.policy.confirm")}
        </span>
      </label>
      {error && (
        <p id="accommodation-policy-error" className="mt-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function PaymentMethodSelector({
  value,
  onlinePaymentAvailable,
  onChange,
}: {
  value: "online" | "cash";
  onlinePaymentAvailable: boolean;
  onChange: (value: "online" | "cash") => void;
}) {
  const { t } = useT();
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">{t("section.payment")}</legend>
      {onlinePaymentAvailable && (
        <PaymentOption
          checked={value === "online"}
          value="online"
          icon="euro"
          label={t("pay.online")}
          badge={t("pay.recommended")}
          description={t("pay.online.desc")}
          detail={t("pay.online.secure")}
          trustContent={<OnlinePaymentTrust />}
          onChange={() => onChange("online")}
        />
      )}
      <PaymentOption
        checked={value === "cash"}
        value="cash"
        icon="confirmation"
        label={t("pay.cash")}
        description={t("pay.cash.desc")}
        detail={t("pay.cash.detail")}
        onChange={() => onChange("cash")}
      />
      {!onlinePaymentAvailable && (
        <p className="px-1 text-xs leading-relaxed text-brand-800/55">{t("pay.online.disabled.desc")}</p>
      )}
    </fieldset>
  );
}

function PaymentOption({
  checked,
  value,
  icon,
  label,
  badge,
  description,
  detail,
  trustContent,
  onChange,
}: {
  checked: boolean;
  value: "online" | "cash";
  icon: BrandIconName;
  label: string;
  badge?: string;
  description: string;
  detail: string;
  trustContent?: React.ReactNode;
  onChange: () => void;
}) {
  return (
    <label className={`relative flex min-h-24 cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 transition-[border-color,box-shadow,background-color] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-500 has-[:focus-visible]:ring-offset-2 sm:p-5 ${
      checked
        ? "border-brand-700 bg-sage-50/45 shadow-[0_0_0_1px_rgba(11,73,56,0.12)]"
        : "border-cream-300 hover:border-brand-300"
    }`}>
      <input
        type="radio"
        name="payment-method"
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <BrandIconTile name={icon} size="md" tone={checked ? "solid" : "light"} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-brand-900">{label}</span>
          {badge && (
            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-800">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-brand-800/70">{description}</span>
        <span className="mt-2 block text-xs leading-relaxed text-brand-800/45">{detail}</span>
        {trustContent}
      </span>
      <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        checked ? "border-brand-800 bg-brand-900" : "border-brand-300 bg-white"
      }`} aria-hidden="true">
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
    </label>
  );
}

function OnlinePaymentTrust() {
  const { t } = useT();

  return (
    <span className="mt-4 block border-t border-brand-900/10 pt-3.5">
      <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <span className="flex items-center gap-2">
          <span className="flex h-7 items-center rounded-md border border-brand-900/10 bg-white px-2 shadow-[0_1px_2px_rgba(11,61,46,0.05)]" aria-label="Visa">
            <svg className="h-4 w-8" viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path fill="#1434CB" d="M9.112 8.262 5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 0 1 .894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 0 1 1.913.336l.34-1.59a5.207 5.207 0 0 0-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 0 0-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656 1.02-2.815.588 2.815zm-8.16-4.84-1.603 7.496H8.34l1.605-7.496z" />
            </svg>
          </span>
          <span className="flex h-7 items-center rounded-md border border-brand-900/10 bg-white px-2 shadow-[0_1px_2px_rgba(11,61,46,0.05)]" aria-label="Mastercard">
            <svg className="h-5 w-8" viewBox="0 0 38 24" role="img" aria-hidden="true">
              <circle cx="13" cy="12" r="9" fill="#EB001B" />
              <circle cx="25" cy="12" r="9" fill="#F79E1B" />
              <path fill="#FF5F00" d="M19 5.13A9 9 0 0 1 22 12a9 9 0 0 1-3 6.87A9 9 0 0 1 16 12a9 9 0 0 1 3-6.87Z" />
            </svg>
          </span>
          <span className="text-[11px] font-medium text-brand-800/55">{t("pay.cardsAccepted")}</span>
        </span>

        <span className="inline-flex">
          <Image
            src="/payment-marks/powered-by-stripe.svg"
            alt="Powered by Stripe"
            width={150}
            height={34}
            className="h-[27px] w-auto"
          />
        </span>
      </span>

      <span className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-brand-800/65">
        <svg className="h-3.5 w-3.5 shrink-0 text-sage-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.5 8V6.5a4.5 4.5 0 0 1 9 0V8h.5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h.5Zm2-1.5V8h5V6.5a2.5 2.5 0 0 0-5 0Zm2.5 5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z" clipRule="evenodd" />
        </svg>
        {t("pay.encryptedCheckout")}
      </span>
    </span>
  );
}

function InfoPill({ title, body, icon }: { title: string; body: string; icon: BrandIconName }) {
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[2.5rem_5.5rem_minmax(0,1fr)] sm:items-center sm:gap-x-4">
      <BrandIconTile name={icon} size="md" className="row-span-2 sm:row-span-1" />
      <p className="text-sm font-bold text-brand-900">{title}</p>
      <p className="col-start-2 text-sm leading-relaxed text-brand-800/65 sm:col-start-auto">{body}</p>
    </div>
  );
}

function PriceBreakdown({ pricing }: { pricing: ReturnType<typeof calculatePricing> }) {
  const { t } = useT();
  const { OVERWEIGHT_FEE, VOLUME_DISCOUNT } = PRICING_RULES;
  return (
    <div className="mt-2 space-y-1 rounded-lg bg-white p-3 text-[11px]">
      {pricing.subtotalAmount > 0 && (
        <div className="flex justify-between text-brand-800/50">
          <span>{t("summary.subtotal")}</span>
          <span>{formatEUR(pricing.subtotalAmount)}</span>
        </div>
      )}
      {pricing.discountAmount > 0 && (
        <div className="flex justify-between text-sage-600">
          <span>{t("summary.discount")} ({pricing.discountedBags} × −{formatEUR(VOLUME_DISCOUNT)})</span>
          <span>−{formatEUR(pricing.discountAmount)}</span>
        </div>
      )}
      {pricing.extraWeightAmount > 0 && (
        <div className="flex justify-between text-gold-700">
          <span>{t("summary.overweight")} ({pricing.totalOverweightBags} × {formatEUR(OVERWEIGHT_FEE)})</span>
          <span>+{formatEUR(pricing.extraWeightAmount)}</span>
        </div>
      )}
    </div>
  );
}

function LockerHelp({ cities }: { cities: LockerCity[] }) {
  if (cities.length === 0) return null;

  return (
    <details id="consignas" className="group scroll-mt-24 overflow-hidden rounded-2xl border border-cream-300 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-cream-50 px-4 py-4 marker:hidden sm:px-5">
        <div className="flex items-start gap-3">
          <BrandIconTile name="accommodation" size="md" tone="solid" className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-900">Consignas / lockers</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-800/70">
              Si no encuentras tu alojamiento, escoge la consigna o locker más cercana. Tienes opciones en todas estas ciudades.
            </p>
          </div>
        </div>
        <svg className="h-5 w-5 shrink-0 text-brand-700 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" />
        </svg>
      </summary>

      <div className="space-y-3 border-t border-cream-200 px-4 py-4 sm:px-5">
        <div className="rounded-xl border border-gold-200/80 bg-gold-50/70 px-3.5 py-3 text-sm text-gold-900">
          El precio de la consigna se paga cuando vayas a recoger tu equipaje, salvo que el establecimiento indique otra cosa.
        </div>

        <div className="space-y-2.5">
          {cities.map((city) => (
            <details key={city.city} className="group overflow-hidden rounded-xl border border-cream-300/80 bg-cream-50/50 transition-colors open:bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-sm font-semibold text-brand-900 marker:hidden">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-lg bg-sage-100 px-2 text-[10px] font-bold uppercase tracking-wide text-sage-700">
                    {city.city.slice(0, 3)}
                  </span>
                  <span>{city.city}</span>
                </div>
                <svg className="h-4 w-4 shrink-0 text-brand-800/45 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>

              <div className="space-y-2 border-t border-cream-200/80 bg-white px-3.5 py-3">
                {city.spots.map((spot) => (
                  <a
                    key={spot.id}
                    href={spot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-cream-200 px-3.5 py-3 transition-colors hover:border-sage-300 hover:bg-sage-50/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-900">{spot.name}</p>
                        {spot.address && (
                          <p className="mt-1 text-xs leading-relaxed text-brand-800/45">
                            {spot.address}
                          </p>
                        )}
                        {spot.note && (
                          <p className="mt-2 rounded-lg border border-gold-200/70 bg-gold-50/70 px-2.5 py-2 text-[11px] leading-relaxed text-gold-900/85">
                            {spot.note}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-sage-700">Abrir mapa</span>
                    </div>
                  </a>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </details>
  );
}

function FormSection({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white sm:h-9 sm:w-9">
            {step}
          </span>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-brand-900 sm:text-xl">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-brand-800/60 sm:text-sm">{subtitle}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function SubmitButton({
  submitting,
  submissionStage,
  paymentMethod,
  total,
}: {
  submitting: boolean;
  submissionStage: "saving" | "redirecting";
  paymentMethod: "online" | "cash";
  total: number;
}) {
  const { t } = useT();
  const actionLabel = paymentMethod === "online" ? t("submit.pay") : t("submit.confirm");
  const label = `${actionLabel}${total > 0 ? ` · ${formatEUR(total)}` : ""}`;

  return (
    <button
      type="submit"
      disabled={submitting}
      className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-brand-900 px-5 py-3.5 text-sm font-bold text-white shadow-md transition-[background-color,box-shadow,transform] hover:bg-brand-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
    >
      {submitting ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{submissionStage === "redirecting" ? t("submit.redirecting") : t("submit.processing")}</span>
        </>
      ) : (
        <>
          <span className="truncate">{label}</span>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </>
      )}
    </button>
  );
}

function MobileSummary({
  legs,
  pricing,
  submitting,
  submissionStage,
  paymentMethod,
}: {
  legs: StageLeg[];
  pricing: ReturnType<typeof calculatePricing>;
  submitting: boolean;
  submissionStage: "saving" | "redirecting";
  paymentMethod: "online" | "cash";
}) {
  const { t } = useT();
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
      <div className="flex items-center gap-2.5 bg-brand-900 px-5 py-3.5">
        <BrandIconTile name="backpack" size="sm" tone="dark" />
        <h3 className="text-sm font-bold text-white">{t("summary.resumen")}</h3>
      </div>
      <div className="space-y-2.5 px-5 py-4">
        <div className="flex justify-between text-[13px] text-brand-800/70">
          <span>{t("summary.luggage")}</span>
          <span className="font-semibold text-brand-900">{pricing.totalBags} {pricing.totalBags === 1 ? t("summary.backpack") : t("summary.backpacks")}</span>
        </div>
        <div className="flex justify-between text-[13px] text-brand-800/70">
          <span>{t("summary.transports")}</span>
          <span className="font-semibold text-brand-900">{legs.length}</span>
        </div>
        {pricing.totalTransportUnits > pricing.totalBags && (
          <div className="flex justify-between text-[13px] text-brand-800/70">
            <span>{t("summary.units")}</span>
            <span className="font-semibold text-gold-700">{pricing.totalTransportUnits}</span>
          </div>
        )}
        <PriceBreakdown pricing={pricing} />
        {pricing.totalTransportUnits > pricing.totalBags && (
          <p className="text-[11px] leading-relaxed text-brand-800/45">{t("summary.unitsHelp")}</p>
        )}
        <div className="flex items-baseline justify-between border-t border-cream-200 pt-3">
          <span className="text-sm font-bold text-brand-900">{t("summary.total")}</span>
          <span className="tabular-nums text-3xl font-extrabold tracking-tight text-gold-700">{formatEUR(pricing.totalAmount)}</span>
        </div>
      </div>
      <div className="px-5 pb-5">
        <SubmitButton
          submitting={submitting}
          submissionStage={submissionStage}
          paymentMethod={paymentMethod}
          total={pricing.totalAmount}
        />
      </div>
      <div className="border-t border-cream-200 px-5 py-3">
        <div className="flex items-center justify-center gap-2 text-[11px] text-brand-800/35">
          <BrandIcon name="confirmation" className="h-4 w-4 shrink-0 text-brand-700" />
          <span>{t("summary.guarantee")}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label }: { icon: "pickup" | "dropoff" | "date"; label: string }) {
  const iconName: BrandIconName = icon === "pickup" ? "location" : icon === "dropoff" ? "delivery" : "calendar";

  return (
    <div className="flex items-center gap-2 text-[11px] text-brand-800/60">
      <BrandIcon name={iconName} className="h-3.5 w-3.5 shrink-0 text-brand-700" />
      <span className="truncate">{label}</span>
    </div>
  );
}
