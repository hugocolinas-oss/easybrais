"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Accommodation } from "@/lib/types";
import { createBooking } from "@/app/actions";
import { formatEUR, calculatePricing } from "@easybrais/utils";

interface Props {
  accommodations: Accommodation[];
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

  const pricing = calculatePricing([{ bagsCount, overweightBagsCount: overweightBags, stagesCount: 1 }]);

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
            email: email.trim() || "manual@easybrais.com",
            phone: phone.trim(),
            language: "es",
            notes: notes.trim(),
          },
          paymentMethod: "cash",
        },
        idempotencyKeyRef.current,
      );

      if (!res.ok) {
        setError(res.error);
        return;
      }

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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Cliente</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nombre completo *</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Opcional" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
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
            <input type="number" min={1} max={50} value={bagsCount} onChange={(e) => setBagsCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Recogida *</label>
            <select value={pickupId} onChange={(e) => setPickupId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
              <option value="">Selecciona alojamiento</option>
              {accommodations.map((a) => (
                <option key={a.id} value={a.id}>{a.display_name} {a.town ? `(${a.town})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Entrega *</label>
            <select value={dropoffId} onChange={(e) => setDropoffId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
              <option value="">Selecciona alojamiento</option>
              {accommodations.map((a) => (
                <option key={a.id} value={a.id}>{a.display_name} {a.town ? `(${a.town})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Sobrepeso (+20 kg)</label>
            <input type="number" min={0} max={bagsCount} value={overweightBags} onChange={(e) => setOverweightBags(Math.max(0, Math.min(bagsCount, parseInt(e.target.value) || 0)))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div className="flex items-end">
            <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
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
