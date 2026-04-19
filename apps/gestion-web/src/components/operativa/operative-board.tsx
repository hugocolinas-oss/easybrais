"use client";

import { useState } from "react";
import type { OperativeItem } from "@/lib/operative-queries";
import { OperativeRow } from "./operative-row";

interface Props {
  items: OperativeItem[];
}

const STATUS_TABS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "picked_up", label: "Recogidos" },
  { key: "delivered", label: "Entregados" },
  { key: "incident", label: "Incidencias" },
] as const;

export function OperativeBoard({ items }: Props) {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    if (tab !== "all" && item.operational_status !== tab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.booking_code.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q) ||
        item.pickup_name.toLowerCase().includes(q) ||
        item.dropoff_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Tabs + Search */}
      <div className="mb-3 space-y-2 sm:mb-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {STATUS_TABS.map((t) => {
            const count =
              t.key === "all"
                ? items.length
                : items.filter((i) => i.operational_status === t.key).length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:py-1.5 ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-gray-600 active:bg-gray-100"
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código, cliente..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-72 sm:py-2"
          />
        </div>
      </div>

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">
            {items.length === 0
              ? "No hay servicios programados para este día"
              : "No se encontraron resultados con ese filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <OperativeRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
