"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  dateFrom: string;
  dateTo: string;
}

function toISO(d: Date) {
  return d.toISOString().split("T")[0]!;
}

export function ClosureDateFilter({ dateFrom, dateTo }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  function navigate(f: string, t: string) {
    setFrom(f);
    setTo(t);
    const sp = new URLSearchParams();
    if (f) sp.set("dateFrom", f);
    if (t) sp.set("dateTo", t);
    router.push(`/gestion/cierres?${sp.toString()}`);
  }

  function apply() {
    navigate(from, to);
  }

  function clear() {
    setFrom("");
    setTo("");
    router.push("/gestion/cierres");
  }

  function setToday() {
    const today = toISO(new Date());
    navigate(today, today);
  }

  function setWeek() {
    const now = new Date();
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    navigate(toISO(mon), toISO(sun));
  }

  function setMonth() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    navigate(toISO(first), toISO(last));
  }

  const hasFilters = dateFrom || dateTo;

  const quickBtnClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? "bg-brand-600 text-white shadow-sm"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const today = toISO(new Date());
  const now = new Date();
  const day = now.getDay();
  const monDate = new Date(now);
  monDate.setDate(now.getDate() - ((day + 6) % 7));
  const sunDate = new Date(monDate);
  sunDate.setDate(monDate.getDate() + 6);
  const monthFirst = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthLast = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const isToday = from === today && to === today;
  const isWeek = from === toISO(monDate) && to === toISO(sunDate);
  const isMonth = from === monthFirst && to === monthLast;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Quick filter buttons */}
      <div className="mb-3 flex gap-2">
        <button type="button" onClick={setToday} className={quickBtnClass(isToday)}>
          Hoy
        </button>
        <button type="button" onClick={setWeek} className={quickBtnClass(isWeek)}>
          Semana
        </button>
        <button type="button" onClick={setMonth} className={quickBtnClass(isMonth)}>
          Mes
        </button>
        {hasFilters && (
          <button type="button" onClick={clear}
            className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
            Limpiar
          </button>
        )}
      </div>

      {/* Custom date range */}
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
      </div>
    </div>
  );
}
