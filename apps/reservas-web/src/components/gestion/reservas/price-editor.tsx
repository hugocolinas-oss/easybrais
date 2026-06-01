"use client";

import { useState, useTransition } from "react";
import { updateBookingPrice } from "@/app/gestion/(dashboard)/reservas/actions";

interface Props {
  bookingId: string;
  currentTotal: number;
}

export function PriceEditor({ bookingId, currentTotal }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentTotal));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const num = parseFloat(value.replace(",", "."));
    if (!Number.isFinite(num) || num < 0) {
      setError("Precio inválido");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateBookingPrice(bookingId, num);
      if (res && "error" in res) {
        setError(res.error ?? "Error al actualizar el precio.");
      } else {
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(String(currentTotal)); setEditing(true); setError(null); }}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-brand-700 transition-colors group"
        title="Editar precio"
      >
        {currentTotal.toFixed(2).replace(".", ",")} €
        <svg className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        disabled={pending}
        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        autoFocus
      />
      <span className="text-sm text-gray-500">€</span>
      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "..." : "OK"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={pending}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Cancelar
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
