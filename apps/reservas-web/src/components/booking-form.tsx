"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { Accommodation, BookingType, StageLeg, BookingFormData } from "@/lib/types";
import { calculatePricing, formatEUR, fmtDateShort, PRICING_RULES } from "@easybrais/utils";
import { createBooking, type BookingSuccess } from "@/app/actions";
import { BookingTypeSelector } from "./booking-type-selector";
import { LegForm } from "./leg-form";
import { CustomerFields } from "./customer-fields";
import { BookingConfirmation } from "./booking-confirmation";

interface Props {
  allAccommodations: Accommodation[];
}

const FULL_CAMINO_LEGS = 8;

type PaymentMethod = "online" | "cash";

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

function stageNumberFromCode(acc: Accommodation): number | null {
  if (!acc.external_code) return null;
  const n = parseInt(acc.external_code.split(".")[0], 10);
  return Number.isNaN(n) ? null : n;
}

function getStagesCount(
  pickupAcc: Accommodation | undefined,
  dropoffAcc: Accommodation | undefined,
): number {
  if (!pickupAcc || !dropoffAcc) return 1;
  const p = stageNumberFromCode(pickupAcc);
  const d = stageNumberFromCode(dropoffAcc);
  if (p === null || d === null) return 1;
  return Math.max(1, Math.abs(d - p));
}

export function BookingForm({ allAccommodations }: Props) {
  const [bookingType, setBookingType] = useState<BookingType>("single_stage");
  const [legs, setLegs] = useState<StageLeg[]>([createLeg()]);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingSuccess | null>(null);

  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const accMap = useMemo(
    () => new Map(allAccommodations.map((a) => [a.id, a])),
    [allAccommodations],
  );

  const towns = useMemo(() => {
    const seen = new Map<string, string>();
    allAccommodations.forEach((a) => {
      if (!a.town) return;
      const key = a.town.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, a.town.trim());
    });
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
  }, [allAccommodations]);

  const pricing = useMemo(
    () =>
      calculatePricing(
        legs.map((l) => {
          const pickup = accMap.get(l.pickupAccommodationId);
          const dropoff = accMap.get(l.dropoffAccommodationId);
          return {
            bagsCount: l.bagsCount,
            overweightBagsCount: l.overweightBagsCount,
            stagesCount: getStagesCount(pickup, dropoff),
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
      } else if (type === "multi_stage") {
        setLegs((prev) => {
          if (prev.length <= 2) {
            const filled = prev.slice(0, 2);
            while (filled.length < 2) filled.push(createLeg());
            return filled;
          }
          return [prev[0] ?? createLeg(), prev[1] ?? createLeg()];
        });
      } else if (type === "full_camino") {
        setLegs(Array.from({ length: FULL_CAMINO_LEGS }, () => createLeg()));
      }
    },
    [],
  );

  function updateLeg(index: number, updated: StageLeg) {
    setLegs((prev) => {
      const next = prev.map((l, i) => (i === index ? updated : l));

      const dropoffChanged = prev[index]?.dropoffAccommodationId !== updated.dropoffAccommodationId;
      if (dropoffChanged && updated.dropoffAccommodationId && index < next.length - 1) {
        const dropoffAcc = accMap.get(updated.dropoffAccommodationId);
        const nextLeg = next[index + 1];
        if (nextLeg) {
          next[index + 1] = {
            ...nextLeg,
            departureTown: dropoffAcc?.town ?? "",
            pickupAccommodationId: updated.dropoffAccommodationId,
          };
        }
      }

      const arrivalTownChanged = prev[index]?.arrivalTown !== updated.arrivalTown;
      if (arrivalTownChanged && updated.arrivalTown && index < next.length - 1) {
        const nextLeg = next[index + 1];
        if (nextLeg && !nextLeg.departureTown) {
          next[index + 1] = {
            ...nextLeg,
            departureTown: updated.arrivalTown,
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

    if (!customer.fullName.trim()) errs.fullName = "Obligatorio";
    if (!customer.email.trim()) errs.email = "Obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(customer.email))
      errs.email = "Email no válido";
    if (!customer.phone.trim()) errs.phone = "Obligatorio";

    legs.forEach((leg, i) => {
      const p = `leg_${i}`;
      if (!leg.serviceDate) errs[`${p}_date`] = "Selecciona fecha";
      if (!leg.pickupAccommodationId)
        errs[`${p}_pickup`] = "Selecciona recogida";
      if (!leg.dropoffAccommodationId)
        errs[`${p}_dropoff`] = "Selecciona entrega";
      if (leg.bagsCount < 1) errs[`${p}_bags`] = "Mínimo 1";
      if (
        leg.pickupAccommodationId &&
        leg.dropoffAccommodationId &&
        leg.pickupAccommodationId === leg.dropoffAccommodationId
      ) {
        errs[`${p}_dropoff`] = "Debe ser diferente a la recogida";
      }
    });

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);

    try {
      const data: BookingFormData = {
        bookingType,
        legs,
        customer,
        paymentMethod: paymentMethod === "cash" ? "cash" : "online",
      };
      const res = await createBooking(data, idempotencyKeyRef.current);

      if (!res.ok) {
        setServerError(res.error);
        return;
      }

      if (res.stripeEnabled && paymentMethod === "online") {
        const checkoutRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: res.bookingId }),
        });

        const checkoutData = await checkoutRes.json();

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }

        setServerError(checkoutData.error ?? "Error al iniciar el pago. Tu reserva ha sido creada con código " + res.bookingCode);
        return;
      }

      setResult(res);
    } catch {
      setServerError("Error de conexión. Comprueba tu conexión a internet e inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewBooking() {
    setResult(null);
    setLegs([createLeg()]);
    setCustomer(EMPTY_CUSTOMER);
    setBookingType("single_stage");
    setPaymentMethod("online");
    setErrors({});
    setServerError(null);
    idempotencyKeyRef.current = crypto.randomUUID();
  }

  if (result) {
    return <BookingConfirmation result={result} onNewBooking={handleNewBooking} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* Left column — Form */}
        <div className="space-y-6 sm:space-y-8">
          {/* Section 1: Booking Type */}
          <FormSection step={1} title="Tipo de reserva" subtitle="Elige el tipo de servicio que necesitas">
            <BookingTypeSelector value={bookingType} onChange={handleTypeChange} />
          </FormSection>

          {/* Section 2: Transport Legs */}
          <FormSection step={2} title="Detalles del servicio" subtitle="Configura cada transporte">
            <div className="space-y-4">
              {legs.map((leg, i) => {
                const pickup = accMap.get(leg.pickupAccommodationId);
                const dropoff = accMap.get(leg.dropoffAccommodationId);
                const stages = getStagesCount(pickup, dropoff);
                return (
                  <LegForm
                    key={leg.id}
                    leg={leg}
                    index={i}
                    towns={towns}
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

              {(bookingType === "multi_stage" || bookingType === "full_camino") && (
                <button
                  type="button"
                  onClick={addLeg}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50/50 px-4 py-4 text-sm font-semibold text-brand-700/60 transition-all hover:border-sage-400 hover:bg-sage-50 hover:text-brand-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Añadir otro transporte
                </button>
              )}
            </div>
          </FormSection>

          {/* Section 3: Customer */}
          <FormSection step={3} title="Tus datos" subtitle="Necesitamos tus datos de contacto para la reserva">
            <div className="rounded-2xl border border-cream-300/80 bg-white p-4 shadow-card sm:p-6">
              <CustomerFields
                value={customer}
                onChange={setCustomer}
                errors={errors}
              />
            </div>
          </FormSection>

          {/* Section 4: Payment Method */}
          <FormSection step={4} title="Método de pago" subtitle="Elige cómo prefieres pagar">
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </FormSection>

          {/* Validation errors */}
          {Object.keys(errors).length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50 p-4">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium text-red-700">
                Revisa los campos marcados en rojo antes de continuar.
              </p>
            </div>
          )}

          {serverError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50 p-4">
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
              accMap={accMap}
              pricing={pricing}
              submitting={submitting}
              paymentMethod={paymentMethod}
            />
          </div>
        </div>

        {/* Right column — Sticky Summary (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <div className="overflow-hidden rounded-2xl border border-cream-300/80 bg-white shadow-soft">
              {/* Summary header */}
              <div className="bg-brand-900 px-6 py-4">
                <h3 className="text-sm font-bold tracking-wide text-white">Resumen de tu reserva</h3>
                <p className="mt-0.5 text-[11px] text-white/50">Revisa antes de confirmar</p>
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
                        <span className="text-xs font-semibold text-brand-900">Transporte {i + 1}</span>
                        {stages > 1 && (
                          <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[9px] font-bold text-gold-700">
                            {stages} etapas
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
                        <p className="ml-7 mt-1 text-[11px] italic text-brand-800/25">Sin completar</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t border-cream-200 bg-cream-50 px-6 py-4">
                <div className="flex justify-between text-[13px] text-brand-800/70">
                  <span>Total equipaje</span>
                  <span className="font-semibold text-brand-900">
                    {pricing.totalBags} {pricing.totalBags === 1 ? "mochila" : "mochilas"}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-[13px] text-brand-800/70">
                  <span>Transportes</span>
                  <span className="font-semibold text-brand-900">{legs.length}</span>
                </div>
                {pricing.totalTransportUnits > pricing.totalBags && (
                  <div className="mt-1 flex justify-between text-[13px] text-brand-800/70">
                    <span>Unidades de transporte</span>
                    <span className="font-semibold text-gold-700">{pricing.totalTransportUnits}</span>
                  </div>
                )}

                <div className="mt-4 flex items-baseline justify-between border-t border-cream-300/60 pt-4">
                  <span className="text-sm font-bold text-brand-900">Precio total</span>
                  <span className="text-2xl font-extrabold tracking-tight text-gold-600">
                    {formatEUR(pricing.totalAmount)}
                  </span>
                </div>

                {pricing.totalBags === 0 && (
                  <p className="mt-2 text-center text-[10px] text-brand-800/30">
                    El precio se calcula según los transportes seleccionados
                  </p>
                )}

                <details className="mt-3 group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 text-[11px] font-medium text-brand-800/40 transition-colors hover:text-brand-800/60">
                    <span>Ver desglose</span>
                    <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <PriceBreakdown pricing={pricing} />
                </details>
              </div>

              {/* Submit button */}
              <div className="px-6 pb-5 pt-1">
                <SubmitButton submitting={submitting} total={pricing.totalAmount} paymentMethod={paymentMethod} />
              </div>

              {/* Guarantee */}
              <div className="border-t border-cream-200 px-6 py-3">
                <div className="flex items-center gap-2 text-[11px] text-brand-800/35">
                  <svg className="h-3.5 w-3.5 shrink-0 text-sage-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span>Entrega garantizada antes de las 15:30</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function PaymentMethodSelector({ value, onChange }: { value: PaymentMethod; onChange: (v: PaymentMethod) => void }) {
  const options: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: "online",
      label: "Pago online",
      desc: "Tarjeta de crédito/débito (Stripe)",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
    },
    {
      id: "cash",
      label: "Pago en efectivo",
      desc: "Paga al recoger el equipaje",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={[
              "group relative flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all",
              selected
                ? "border-brand-900 bg-white shadow-card ring-1 ring-brand-900/10"
                : "border-cream-300/80 bg-white/60 hover:border-cream-400 hover:bg-white hover:shadow-card",
            ].join(" ")}
          >
            {selected && (
              <span className="absolute -top-2 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-900 shadow-sm">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            )}
            <span
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                selected
                  ? "bg-gold-500/15 text-gold-700"
                  : "bg-cream-200/60 text-brand-800/30 group-hover:bg-cream-200 group-hover:text-brand-800/50",
              ].join(" ")}
            >
              {opt.icon}
            </span>
            <div className="min-w-0">
              <span className={["block text-sm font-bold", selected ? "text-brand-900" : "text-brand-900/70"].join(" ")}>
                {opt.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-brand-800/40">{opt.desc}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PriceBreakdown({ pricing }: { pricing: ReturnType<typeof calculatePricing> }) {
  const { BASE_PRICE, REDUCED_PRICE, OVERWEIGHT_FEE } = PRICING_RULES;
  return (
    <div className="mt-2 space-y-1 rounded-lg bg-white p-3 text-[11px]">
      {pricing.normalBags > 0 && (
        <div className="flex justify-between text-brand-800/50">
          <span>{pricing.normalBags} × {formatEUR(BASE_PRICE)}</span>
          <span>{formatEUR(pricing.normalBags * BASE_PRICE)}</span>
        </div>
      )}
      {pricing.discountedBags > 0 && (
        <div className="flex justify-between text-sage-600">
          <span>{pricing.discountedBags} × {formatEUR(REDUCED_PRICE)} (dto. volumen)</span>
          <span>{formatEUR(pricing.discountedBags * REDUCED_PRICE)}</span>
        </div>
      )}
      {pricing.extraWeightAmount > 0 && (
        <div className="flex justify-between text-gold-700">
          <span>Sobrepeso ({pricing.totalOverweightBags} × {formatEUR(OVERWEIGHT_FEE)})</span>
          <span>+{formatEUR(pricing.extraWeightAmount)}</span>
        </div>
      )}
    </div>
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
    <section>
      <div className="mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-xs font-bold text-white shadow-sm sm:h-8 sm:w-8">
            {step}
          </span>
          <div>
            <h3 className="text-base font-bold text-brand-900 sm:text-lg">{title}</h3>
            <p className="text-[11px] text-brand-800/40 sm:text-xs">{subtitle}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function SubmitButton({ submitting, total, paymentMethod }: { submitting: boolean; total: number; paymentMethod: PaymentMethod }) {
  const label = paymentMethod === "cash"
    ? `Confirmar reserva${total > 0 ? ` — ${formatEUR(total)}` : ""}`
    : `Reservar y pagar${total > 0 ? ` — ${formatEUR(total)}` : ""}`;

  return (
    <button
      type="submit"
      disabled={submitting}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand-900 px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
    >
      {submitting ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Procesando...</span>
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
  accMap,
  pricing,
  submitting,
  paymentMethod,
}: {
  legs: StageLeg[];
  accMap: Map<string, Accommodation>;
  pricing: ReturnType<typeof calculatePricing>;
  submitting: boolean;
  paymentMethod: PaymentMethod;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-300/80 bg-white shadow-soft">
      <div className="bg-brand-900 px-5 py-3.5">
        <h3 className="text-sm font-bold text-white">Resumen</h3>
      </div>
      <div className="space-y-2.5 px-5 py-4">
        <div className="flex justify-between text-[13px] text-brand-800/70">
          <span>Equipaje</span>
          <span className="font-semibold text-brand-900">{pricing.totalBags} mochilas</span>
        </div>
        <div className="flex justify-between text-[13px] text-brand-800/70">
          <span>Transportes</span>
          <span className="font-semibold text-brand-900">{legs.length}</span>
        </div>
        {pricing.totalTransportUnits > pricing.totalBags && (
          <div className="flex justify-between text-[13px] text-brand-800/70">
            <span>Uds. transporte</span>
            <span className="font-semibold text-gold-700">{pricing.totalTransportUnits}</span>
          </div>
        )}
        <PriceBreakdown pricing={pricing} />
        <div className="flex items-baseline justify-between border-t border-cream-200 pt-3">
          <span className="text-sm font-bold text-brand-900">Total</span>
          <span className="text-2xl font-extrabold tracking-tight text-gold-600">{formatEUR(pricing.totalAmount)}</span>
        </div>
      </div>
      <div className="px-5 pb-5">
        <SubmitButton submitting={submitting} total={pricing.totalAmount} paymentMethod={paymentMethod} />
      </div>
      <div className="border-t border-cream-200 px-5 py-3">
        <div className="flex items-center justify-center gap-2 text-[11px] text-brand-800/35">
          <svg className="h-3.5 w-3.5 shrink-0 text-sage-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span>Entrega garantizada antes de las 15:30</span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label }: { icon: "pickup" | "dropoff" | "date"; label: string }) {
  const iconEl = {
    pickup: <span className="h-1.5 w-1.5 rounded-full bg-sage-500" />,
    dropoff: <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />,
    date: (
      <svg className="h-3 w-3 text-brand-800/30" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-2 text-[11px] text-brand-800/60">
      {iconEl[icon]}
      <span className="truncate">{label}</span>
    </div>
  );
}
