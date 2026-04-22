"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { OPERATIONAL_STATUSES, getStatusConfig } from "@/lib/gestion/booking-status";

const PAYMENT_STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "refunded", label: "Reembolsado" },
];

export function BookingFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const push = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(params.toString());
      if (value) sp.set(key, value);
      else sp.delete(key);
      sp.delete("page");
      router.push(`/gestion/reservas?${sp.toString()}`);
    },
    [router, params],
  );

  const hasFilters = params.get("q") || params.get("status") || params.get("dateFrom") || params.get("dateTo") || params.get("paymentStatus");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        <div className="w-full sm:w-60">
          <label className="mb-1 block text-xs font-medium text-gray-500">Buscar</label>
          <input
            type="text"
            placeholder="Código, cliente, email, teléfono…"
            defaultValue={params.get("q") ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") push("q", e.currentTarget.value);
            }}
            onBlur={(e) => push("q", e.currentTarget.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="w-[calc(50%-0.25rem)] sm:w-40">
          <label className="mb-1 block text-xs font-medium text-gray-500">Estado</label>
          <select
            value={params.get("status") ?? ""}
            onChange={(e) => push("status", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Todos</option>
            {OPERATIONAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getStatusConfig(s).label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[calc(50%-0.25rem)] sm:w-36">
          <label className="mb-1 block text-xs font-medium text-gray-500">Pago</label>
          <select
            value={params.get("paymentStatus") ?? ""}
            onChange={(e) => push("paymentStatus", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Todos</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[calc(50%-0.25rem)] sm:w-auto">
          <label className="mb-1 block text-xs font-medium text-gray-500">Desde</label>
          <input
            type="date"
            value={params.get("dateFrom") ?? ""}
            onChange={(e) => push("dateFrom", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="w-[calc(50%-0.25rem)] sm:w-auto">
          <label className="mb-1 block text-xs font-medium text-gray-500">Hasta</label>
          <input
            type="date"
            value={params.get("dateTo") ?? ""}
            onChange={(e) => push("dateTo", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/gestion/reservas")}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
