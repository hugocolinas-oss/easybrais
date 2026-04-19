"use client";

import { useState } from "react";
import type { DailyRoute } from "@/lib/route-queries";
import { StopRow } from "./stop-row";

interface Props {
  route: DailyRoute;
}

type FilterTab = "all" | "pickup" | "dropoff" | "pending" | "completed";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pickup", label: "Recogidas" },
  { key: "dropoff", label: "Entregas" },
  { key: "pending", label: "Pendientes" },
  { key: "completed", label: "Completadas" },
];

export function RouteBoard({ route }: Props) {
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = route.stops.filter((stop) => {
    if (tab === "pickup") return stop.stop_type === "pickup";
    if (tab === "dropoff") return stop.stop_type === "dropoff";
    if (tab === "pending") return !stop.completed;
    if (tab === "completed") return stop.completed;
    return true;
  });

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => {
          const count =
            t.key === "all"
              ? route.stops.length
              : route.stops.filter((s) => {
                  if (t.key === "pickup") return s.stop_type === "pickup";
                  if (t.key === "dropoff") return s.stop_type === "dropoff";
                  if (t.key === "pending") return !s.completed;
                  if (t.key === "completed") return s.completed;
                  return true;
                }).length;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stop list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">No hay paradas con este filtro</p>
        </div>
      ) : (
        <div className="pl-1">
          {filtered.map((stop, i) => (
            <StopRow
              key={stop.id}
              stop={stop}
              routeId={route.id}
              isFirst={i === 0}
              isLast={i === filtered.length - 1}
              totalStops={filtered.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
