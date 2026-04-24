"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Accommodation } from "@/lib/types";
import { createBooking } from "@/app/actions";
import { formatEUR, calculatePricing, getRealEtapas } from "@easybrais/utils";

interface Props {
  accommodations: Accommodation[];
}

function stageNumberFromCode(acc: Accommodation): number | null {
  if (!acc.external_code) return null;
  const n = parseInt(acc.external_code.split(".")[0], 10);
  return Number.isNaN(n) ? null : n;
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
    const q = search.toLowerCase();
    return accommodations.filter(
      (a) =>
        (a.display_name ?? a.name).toLowerCase().includes(q) ||
        (a.town ?? "").toLowerCase().includes(q) ||
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

export function ManualBookingForm({ accommodations }: Props) {
  const router = useRouter();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [pickupId, setPickupId] = useState("");
  const [dropoffId, setDropoffId] = useState("");
  const [bagsCount, setBagsCount] = useState(1);
  const [overweightBags, setOverweightBags] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accMap = useMemo(() => new Map(accommodations.map((a) => [a.id, a])), [accommodations]);

  const sortedAccommodations = useMemo(
    () => [...accommodations].sort((a, b) => (stageNumberFromCode(a) ?? 999) - (stageNumberFromCode(b) ?? 999)),
    [accommodations],
  );

  const { stagesCount, pickupPrefix, dropoffPrefix } = useMemo(() => {
    const pickup = accMap.get(pickupId);
    const dropoff = accMap.get(dropoffId);
    if (!pickup || !dropoff) return { stagesCount: 1, pickupPrefix: null, dropoffPrefix: null };
    const p = stageNumberFromCode(pickup);
    const d = stageNumberFromCode(dropoff);
    if (p === null || d === null) return { stagesCount: 1, pickupPrefix: p, dropoffPrefix: d };
    return { stagesCount: getRealEtapas(p, d), pickupPrefix: p, dropoffPrefix: d };
  }, [pickupId, dropoffId, accMap]);

  const pricing = calculatePricing([{ bagsCount, overweightBagsCount: overweightBags, stagesCount, pickupPrefix, dropoffPrefix }]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) { setError("Nombre obligatorio"); return; }
    if (!serviceDate) { setError("Fecha obligatoria"); return; }
    if (!pickupId) { setError("Selecciona recogida"); return; }
    if (!dropoffId) { setError("Selecciona entrega"); return; }
    if (pickupId === dropoffId) { setError("Recogida y entrega deben ser diferentes"); return; }

    setSubmitting(true);

    try {
      const currentKey = idempotencyKeyRef.current;
      const res = await createBooking(
        {
          bookingType: "single_stage",
          legs: [{
            id: crypto.randomUUID(),
            serviceDate,
            departureTown: "",
            pickupAccommodationId: pickupId,
            arrivalTown: "",
            dropoffAccommodationId: dropoffId,
            bagsCount,
            overweightBagsCount: overweightBags,
          }],
          customer: {
            fullName: fullName.trim(),
            email: email.trim() || `manual+${crypto.randomUUID().slice(0, 8)}@easybrais.com`,
            phone: phone.trim(),
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
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Notas</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Transporte</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Fecha del servicio *</label>
            <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Mochilas</label>
            <input
              type="number"
              min={1}
              max={50}
              value={bagsCount}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setBagsCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <AccommodationCombobox label="Recogida *" value={pickupId} accommodations={sortedAccommodations} onChange={setPickupId} />
          <AccommodationCombobox label="Entrega *" value={dropoffId} accommodations={sortedAccommodations} onChange={setDropoffId} />
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
            <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
              {stagesCount > 1 && (
                <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                  {stagesCount} etapas
                </span>
              )}
              <span className="text-gray-500">Total: </span>
              <span className="font-bold text-gray-900">{formatEUR(pricing.totalAmount)}</span>
            </div>
          </div>
        </div>
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
        {submitting ? "Creando..." : "Crear reserva"}
      </button>
    </form>
  );
}
