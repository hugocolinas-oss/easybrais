"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import type { DailyRoute, RouteStop } from "@/lib/gestion/route-queries";
import { reorderStops } from "@/app/gestion/(dashboard)/ruta/actions";
import { getPaymentCollectionBucket } from "@/lib/gestion/payment-status";
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
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash_pending" | "online_pending">("all");
  const [localStops, setLocalStops] = useState<RouteStop[]>(route.stops);

  useEffect(() => {
    setLocalStops(route.stops);
  }, [route.stops]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const touchStartY = useRef(0);
  const touchItemIdx = useRef<number | null>(null);

  const filtered = localStops.filter((stop) => {
    if (tab === "pickup") return stop.stop_type === "pickup";
    if (tab === "dropoff") return stop.stop_type === "dropoff";
    if (tab === "pending") return !stop.completed;
    if (tab === "completed") return stop.completed;
    return true;
  }).filter((stop) => {
    if (paymentFilter === "all") return true;
    return getPaymentCollectionBucket(stop.payment_status, stop.payment_method, stop.source_channel) === paymentFilter;
  });

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setOverIdx(idx);
  }

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    applyReorder(dragIdx, targetIdx);
    setDragIdx(null);
    setOverIdx(null);
  }

  function handleTouchStart(e: React.TouchEvent, idx: number) {
    touchStartY.current = e.touches[0]!.clientY;
    touchItemIdx.current = idx;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchItemIdx.current === null) return;
    const deltaY = e.changedTouches[0]!.clientY - touchStartY.current;
    const threshold = 50;
    const from = touchItemIdx.current;

    if (Math.abs(deltaY) > threshold) {
      const dir = deltaY > 0 ? 1 : -1;
      const to = from + dir;
      if (to >= 0 && to < filtered.length) {
        applyReorder(from, to);
      }
    }
    touchItemIdx.current = null;
  }

  function applyReorder(fromIdx: number, toIdx: number) {
    const fromStop = filtered[fromIdx];
    const toStop = filtered[toIdx];
    if (!fromStop || !toStop) return;

    const fromGlobalIdx = localStops.findIndex((s) => s.id === fromStop.id);
    const toGlobalIdx = localStops.findIndex((s) => s.id === toStop.id);
    if (fromGlobalIdx === -1 || toGlobalIdx === -1) return;

    const next = [...localStops];
    const [moved] = next.splice(fromGlobalIdx, 1);
    next.splice(toGlobalIdx, 0, moved!);

    next.forEach((s, i) => { s.position = i + 1; });
    setLocalStops(next);

    startTransition(async () => {
      await reorderStops(route.id, next.map((s) => s.id));
    });
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => {
          const count =
            t.key === "all"
              ? localStops.length
              : localStops.filter((s) => {
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
        {isPending && (
          <span className="ml-2 self-center text-[10px] text-gray-400">Guardando orden...</span>
        )}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "all", label: "Todos los pagos" },
          { key: "cash_pending", label: "Efectivo pendiente" },
          { key: "online_pending", label: "Online pendiente" },
        ].map((filter) => {
          const active = paymentFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setPaymentFilter(filter.key as "all" | "cash_pending" | "online_pending")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {filter.label}
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
          {filtered.map((stop, i) => {
            const previous = filtered[i - 1];
            const startsCentral = stop.route_section === "central" && previous?.route_section !== "central";
            return (
              <div key={stop.id}>
                {startsCentral && (
                  <div className="my-4 flex items-center gap-3" aria-label="Inicio del Camino Central">
                    <div className="h-px flex-1 bg-brand-200" />
                    <div className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-center shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">Camino Central</p>
                      <p className="mt-0.5 text-[11px] font-medium text-brand-900/65">Valença · Tui · O Porriño</p>
                    </div>
                    <div className="h-px flex-1 bg-brand-200" />
                  </div>
                )}
                <div
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  onDrop={() => handleDrop(i)}
                  onTouchStart={(e) => handleTouchStart(e, i)}
                  onTouchEnd={(e) => handleTouchEnd(e)}
                  className={`transition-opacity ${
                    dragIdx === i ? "opacity-40" : ""
                  } ${overIdx === i && dragIdx !== i ? "border-t-2 border-brand-500" : ""}`}
                >
                  <StopRow
                    stop={stop}
                    routeId={route.id}
                    isFirst={i === 0}
                    isLast={i === filtered.length - 1}
                    totalStops={filtered.length}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
