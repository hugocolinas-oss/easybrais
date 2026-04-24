"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import type { DailyRoute, RouteStop } from "@/lib/gestion/route-queries";
import { reorderStops } from "@/app/gestion/(dashboard)/ruta/actions";
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

      {/* Stop list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">No hay paradas con este filtro</p>
        </div>
      ) : (
        <div className="pl-1">
          {filtered.map((stop, i) => (
            <div
              key={stop.id}
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
          ))}
        </div>
      )}
    </div>
  );
}
