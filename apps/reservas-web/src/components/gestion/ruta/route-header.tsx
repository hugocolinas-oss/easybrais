"use client";

import { useTransition, useState } from "react";
import type { DailyRoute } from "@/lib/gestion/route-queries";
import { updateRouteStatus, deleteRoute, refreshRoute } from "@/app/gestion/(dashboard)/ruta/actions";
import { GoogleMapsButton } from "./google-maps-button";

interface Props {
  route: DailyRoute;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Borrador", bg: "bg-gray-100", text: "text-gray-700" },
  active: { label: "Activa", bg: "bg-green-100", text: "text-green-700" },
  completed: { label: "Completada", bg: "bg-blue-100", text: "text-blue-700" },
};

export function RouteHeader({ route }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stsCfg = STATUS_LABELS[route.status] ?? { label: "Borrador", bg: "bg-gray-100", text: "text-gray-700" };
  const { summary } = route;
  const progress = summary.totalStops > 0
    ? Math.round((summary.completedStops / summary.totalStops) * 100)
    : 0;

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateRouteStatus(route.id, status);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRoute(route.id);
      setConfirmDelete(false);
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      const res = await refreshRoute(route.id, route.route_date);
      if (res && "error" in res) {
        alert(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Top bar: status + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:gap-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stsCfg.bg} ${stsCfg.text}`}>
            {stsCfg.label}
          </span>
          <div className="text-xs text-gray-600 sm:text-sm">
            <span className="font-semibold text-gray-900">{summary.totalStops}</span> paradas ·{" "}
            <span className="font-semibold text-gray-900">{summary.totalBags}</span> mochilas ·{" "}
            <span className="font-semibold text-gray-900">{summary.completedStops}</span> completadas
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={pending}
            className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50 disabled:opacity-50"
            title="Sincroniza nuevas reservas sin perder el progreso"
          >
            <span className="flex items-center gap-1.5">
              <svg className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Actualizar ruta
            </span>
          </button>
          {route.status === "draft" && (
            <button
              type="button"
              onClick={() => handleStatusChange("active")}
              disabled={pending}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              Activar ruta
            </button>
          )}
          {route.status === "active" && (
            <button
              type="button"
              onClick={() => handleStatusChange("completed")}
              disabled={pending}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              Marcar completada
            </button>
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">¿Seguro?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Eliminar ruta
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-px border-t border-gray-200 bg-gray-200 sm:grid-cols-4">
        <SummaryCard label="Recogidas" value={summary.pickupStops} color="text-amber-600" />
        <SummaryCard label="Entregas" value={summary.dropoffStops} color="text-indigo-600" />
        <SummaryCard label="Mochilas" value={summary.totalBags} color="text-gray-900" />
        <SummaryCard
          label="Progreso"
          value={`${progress}%`}
          color={progress === 100 ? "text-green-600" : "text-brand-600"}
        />
      </div>

      {/* Google Maps link */}
      <div className="border-t border-gray-200 px-3 py-2.5 sm:px-5 sm:py-3">
        <GoogleMapsButton stops={route.stops} />
      </div>

      {/* Localities strip */}
      {summary.localities.length > 0 && (
        <div className="border-t border-gray-200 px-3 py-2.5 sm:px-5 sm:py-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Localidades</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.localities.map((loc) => (
              <span
                key={loc.town}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
              >
                {loc.town}
                <span className="rounded-full bg-gray-300 px-1.5 text-[10px] font-bold text-gray-600">{loc.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {summary.totalStops > 0 && (
        <div className="border-t border-gray-100 px-5 py-3">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white px-4 py-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  );
}
