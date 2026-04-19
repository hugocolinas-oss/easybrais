"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  dateFrom: string;
  dateTo: string;
}

export function ClosureDateFilter({ dateFrom, dateTo }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  function apply() {
    const sp = new URLSearchParams();
    if (from) sp.set("dateFrom", from);
    if (to) sp.set("dateTo", to);
    router.push(`/cierres?${sp.toString()}`);
  }

  function clear() {
    setFrom("");
    setTo("");
    router.push("/cierres");
  }

  const hasFilters = dateFrom || dateTo;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="cf-from" className="mb-1 block text-xs font-medium text-gray-500">Desde</label>
          <input
            id="cf-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label htmlFor="cf-to" className="mb-1 block text-xs font-medium text-gray-500">Hasta</label>
          <input
            id="cf-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={apply}
          className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Filtrar
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
