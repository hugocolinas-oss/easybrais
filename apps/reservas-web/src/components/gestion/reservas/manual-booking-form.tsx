"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Accommodation, BookingType } from "@/lib/types";
import { createBooking } from "@/app/actions";
import { formatEUR, calculatePricing, getRealEtapas } from "@easybrais/utils";
import { PhoneInput } from "@/components/phone-input";
import { normalizePhoneValue } from "@/lib/phone";

interface Props {
  accommodations: Accommodation[];
  showFinancialInfo: boolean;
}

interface LegState {
  id: string;
  serviceDate: string;
  pickupId: string;
  dropoffId: string;
}

function stageNumberFromCode(acc: Accommodation): number | null {
  if (!acc.external_code) return null;
  const n = parseInt(acc.external_code.split(".")[0] ?? "", 10);
  return Number.isNaN(n) ? null : n;
}

function stripAccents(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function AccommodationCombobox({
  label,
  value,
  accommodations,
  onChange,
}: {
  label: string;
  value: string;
  accommodations: Accommodation[];
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = accommodations.find((a) => a.id === value);

  const filtered = useMemo(() => {
    if (!search) return accommodations;
    const q = stripAccents(search);
    return accommodations.filter(
      (a) =>
        stripAccents(a.display_name ?? a.name).includes(q) ||
        stripAccents(a.town ?? "").includes(q) ||
        (a.external_code ?? "").toLowerCase().includes(q),
    );
  }, [accommodations, search]);

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <div className="relative">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={open ? search : selected ? `${selected.display_name ?? selected.name} (${selected.town ?? ""})` : ""}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => { setSearch(""); setOpen(true); }}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder="Buscar alojamiento..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </div>
        {open && (
          <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
            ) : (
              filtered.slice(0, 50).map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onMouseDown={() => { onChange(a.id); setOpen(false); setSearch(""); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50 ${value === a.id ? "bg-brand-50 font-medium" : ""}`}
                  >
                    {a.external_code && (
                      <span className="shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] font-bold text-gray-600">{a.external_code}</span>
                    )}
                    <span className="truncate">{a.display_name ?? a.name}</span>
                    {a.town && <span className="ml-auto shrink-0 text-xs text-gray-400">{a.town}</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function createLeg(): LegState {
  return { id: crypto.randomUUID(), serviceDate: "", pickupId: "", dropoffId: "" };
}

const TYPE_OPTIONS: { id: BookingType; label: string }[] = [
  { id: "single_stage", label: "Un transporte" },
  { id: "multi_stage", label: "Varias etapas" },
  { id: "full_camino", label: "Camino completo" },
];

const FULL_CAMINO_LEGS = 8;

export function ManualBookingForm({ accommodations, showFinancialInfo }: Props) {
  const router = useRouter();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [bagsCount, setBagsCount] = useState(1);
  const [overweightBags, setOverweightBags] = useState(0);
  const [bookingType, setBookingType] = useState<BookingType>("single_stage");
  const [legs, setLegs] = useState<LegState[]>([createLeg()]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accMap = useMemo(() => new Map(accommodations.map((a) => [a.id, a])), [accommodations]);

  const sortedAccommodations = useMemo(
    () => [...accommodations].sort((a, b) => (stageNumberFromCode(a) ?? 999) - (stageNumberFromCode(b) ?? 999)),
    [accommodations],
  );

  const handleTypeChange = useCallback((type: BookingType) => {
    setBookingType(type);
    if (type === "single_stage") {
      setLegs([createLeg()]);
    } else if (type === "multi_stage") {
      setLegs((prev) => {
        const filled = prev.slice(0, 2);
        while (filled.length < 2) filled.push(createLeg());
        return filled;
      });
    } else if (type === "full_camino") {
      setLegs(Array.from({ length: FULL_CAMINO_LEGS }, () => createLeg()));
    }
  }, []);

  function updateLeg(index: number, field: keyof LegState, value: string) {
    setLegs((prev) => {
      const next = [...prev];
      const prevLeg = next[index];
      if (!prevLeg) return next;
      next[index] = { ...prevLeg, [field]: value };

      if (field === "pickupId" && value) {
        const newPickupAcc = accMap.get(value);
        const newPickupCode = newPickupAcc ? stageNumberFromCode(newPickupAcc) : null;
        const currentDropoff = next[index]!.dropoffId;
        if (newPickupCode !== null && currentDropoff) {
          const dropoffAcc = accMap.get(currentDropoff);
          const dropoffCode = dropoffAcc ? stageNumberFromCode(dropoffAcc) : null;
          if (dropoffCode !== null && dropoffCode < newPickupCode) {
            next[index] = { ...next[index]!, dropoffId: "" };
          }
        }
      }

      if (field === "dropoffId" && next[index]!.dropoffId && index < next.length - 1) {
        const downstream = next[index + 1];
        if (downstream) {
          next[index + 1] = { ...downstream, pickupId: next[index]!.dropoffId };
        }
      }

      if (field === "serviceDate" && value && index < next.length - 1) {
        const d = new Date(value);
        d.setDate(d.getDate() + 1);
        const nextDate = d.toISOString().slice(0, 10);
        const downstream = next[index + 1];
        if (downstream && !downstream.serviceDate) {
          next[index + 1] = { ...downstream, serviceDate: nextDate };
        }
      }

      return next;
    });
  }

  function addLeg() {
    setLegs((prev) => {
      const last = prev[prev.length - 1];
      const newLeg = createLeg();
      if (last?.dropoffId) newLeg.pickupId = last.dropoffId;
      return [...prev, newLeg];
    });
  }

  function removeLeg(index: number) {
    if (legs.length <= 1) return;
    setLegs((prev) => prev.filter((_, i) => i !== index));
  }

  const pricing = useMemo(() => {
    return calculatePricing(
      legs.map((leg) => {
        const pickup = accMap.get(leg.pickupId);
        const dropoff = accMap.get(leg.dropoffId);
        const p = pickup ? stageNumberFromCode(pickup) : null;
        const d = dropoff ? stageNumberFromCode(dropoff) : null;
        const stages = p !== null && d !== null ? getRealEtapas(p, d) : 1;
        return { bagsCount, overweightBagsCount: overweightBags, stagesCount: stages, pickupPrefix: p, dropoffPrefix: d };
      }),
    );
  }, [legs, accMap, bagsCount, overweightBags]);

  const routeStages = useMemo(() => {
    const firstPickup = accMap.get(legs[0]?.pickupId ?? "");
    const lastDropoff = accMap.get(legs[legs.length - 1]?.dropoffId ?? "");
    const p = firstPickup ? stageNumberFromCode(firstPickup) : null;
    const d = lastDropoff ? stageNumberFromCode(lastDropoff) : null;
    if (p !== null && d !== null) return getRealEtapas(p, d);
    return 1;
  }, [legs, accMap]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) { setError("Nombre obligatorio"); return; }
    if (!normalizePhoneValue(phone.trim())) { setError("Teléfono obligatorio"); return; }

    for (const [i, leg] of legs.entries()) {
      if (!leg.serviceDate) { setError(`Etapa ${i + 1}: fecha obligatoria`); return; }
      if (!leg.pickupId) { setError(`Etapa ${i + 1}: selecciona recogida`); return; }
      if (!leg.dropoffId) { setError(`Etapa ${i + 1}: selecciona entrega`); return; }
      if (leg.pickupId === leg.dropoffId) { setError(`Etapa ${i + 1}: recogida y entrega deben ser diferentes`); return; }
      const pAcc = accMap.get(leg.pickupId);
      const dAcc = accMap.get(leg.dropoffId);
      const pCode = pAcc ? stageNumberFromCode(pAcc) : null;
      const dCode = dAcc ? stageNumberFromCode(dAcc) : null;
      if (pCode !== null && dCode !== null && dCode < pCode) {
        setError(`Etapa ${i + 1}: la entrega no puede ser anterior a la recogida en la dirección del Camino`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const currentKey = idempotencyKeyRef.current;
      const res = await createBooking(
        {
          bookingType,
          legs: legs.map((leg) => ({
            id: leg.id,
            serviceDate: leg.serviceDate,
            departureTown: "",
            pickupAccommodationId: leg.pickupId,
            arrivalTown: "",
            dropoffAccommodationId: leg.dropoffId,
            bagsCount,
            overweightBagsCount: overweightBags,
          })),
          customer: {
            fullName: fullName.trim(),
            email: email.trim() || `manual+${crypto.randomUUID().slice(0, 8)}@easybrais.com`,
            phone: normalizePhoneValue(phone.trim()),
            language: "es",
            notes: notes.trim(),
          },
          paymentMethod: "cash",
          sourceChannel: "walk_in",
        },
        currentKey,
      );

      if (!res.ok) {
        setError(res.error);
        idempotencyKeyRef.current = crypto.randomUUID();
        return;
      }

      idempotencyKeyRef.current = crypto.randomUUID();
      setSuccess(`Reserva creada: ${res.bookingCode}`);
      setTimeout(() => {
        router.push(`/gestion/reservas/${res.bookingId}`);
      }, 1500);
    } catch {
      setError("Error inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Cliente */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Cliente</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nombre completo *</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Opcional" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Teléfono</label>
            <PhoneInput
              id="manual-booking-phone"
              value={phone}
              onChange={setPhone}
              className="rounded-lg"
              mode="searchable"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Notas</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
        </div>
      </div>

      {/* Tipo de reserva */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Tipo de reserva</h3>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleTypeChange(opt.id)}
              className={[
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                bookingType === opt.id
                  ? "bg-brand-800 text-white shadow-sm"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Mochilas y sobrepeso (global) */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Mochilas</label>
            <input
              type="number"
              min={1}
              max={50}
              value={bagsCount}
              onFocus={(e) => e.target.select()}
              onChange={(e) => { const v = Math.max(1, parseInt(e.target.value) || 1); setBagsCount(v); setOverweightBags((p) => Math.min(p, v)); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Sobrepeso (+20 kg)</label>
            <input
              type="number"
              min={0}
              max={bagsCount}
              value={overweightBags}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setOverweightBags(Math.max(0, Math.min(bagsCount, parseInt(e.target.value) || 0)))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-center">
              {routeStages > 1 && (
                <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                  {routeStages} etapas
                </span>
              )}
              {showFinancialInfo ? (
                <>
                  <span className="text-gray-500">Total: </span>
                  <span className="font-bold text-gray-900">{formatEUR(pricing.totalAmount)}</span>
                </>
              ) : (
                <span className="font-medium text-gray-600">Resumen operativo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-4">
        {legs.map((leg, i) => {
          const pickupLocked = i > 0 && legs[i - 1]?.dropoffId === leg.pickupId && !!leg.pickupId;
          const pickupAcc = accMap.get(leg.pickupId);
          const pCode = pickupAcc ? stageNumberFromCode(pickupAcc) : null;
          const dropoffFiltered = pCode !== null
            ? sortedAccommodations.filter((a) => {
                const c = stageNumberFromCode(a);
                return c === null || c >= pCode;
              })
            : sortedAccommodations;
          return (
            <div key={leg.id} className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Etapa {i + 1}
                </h3>
                {legs.length > 1 && bookingType !== "full_camino" && (
                  <button type="button" onClick={() => removeLeg(i)} className="text-xs text-red-400 hover:text-red-600">
                    Eliminar
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Fecha *</label>
                  <input
                    type="date"
                    value={leg.serviceDate}
                    onChange={(e) => updateLeg(i, "serviceDate", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <AccommodationCombobox
                    label={pickupLocked ? "Recogida * (vinculado)" : "Recogida *"}
                    value={leg.pickupId}
                    accommodations={sortedAccommodations}
                    onChange={(v) => updateLeg(i, "pickupId", v)}
                  />
                </div>
                <div>
                  <AccommodationCombobox
                    label="Entrega *"
                    value={leg.dropoffId}
                    accommodations={dropoffFiltered}
                    onChange={(v) => updateLeg(i, "dropoffId", v)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {bookingType === "multi_stage" && (
          <button
            type="button"
            onClick={addLeg}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-brand-600 hover:text-brand-700"
          >
            + Añadir etapa
          </button>
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Esta reserva se creará con <strong>pago en efectivo</strong>. No se redirigirá a ninguna pasarela de pago.
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{success}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Creando..." : showFinancialInfo ? `Crear reserva — ${formatEUR(pricing.totalAmount)}` : "Crear reserva"}
      </button>
    </form>
  );
}
