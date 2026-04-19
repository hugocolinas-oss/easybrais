"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { OperativeItem } from "@/lib/operative-queries";
import { advanceItemStatus, reportIncident } from "@/app/(dashboard)/operativa/actions";

interface Props {
  item: OperativeItem;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pending:    { label: "Pendiente",   dot: "bg-amber-500",  bg: "bg-amber-50",  text: "text-amber-700" },
  picked_up:  { label: "Recogido",    dot: "bg-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
  delivered:  { label: "Entregado",   dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700" },
  incident:   { label: "Incidencia",  dot: "bg-red-500",    bg: "bg-red-50",    text: "text-red-700" },
};

const FLOW_NEXT: Record<string, { status: string; label: string; icon: string }> = {
  pending:    { status: "picked_up",  label: "Recogido",    icon: "📦" },
  picked_up:  { status: "delivered",  label: "Entregado",   icon: "✅" },
};

export function OperativeRow({ item }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [showIncident, setShowIncident] = useState(false);
  const [incidentMsg, setIncidentMsg] = useState("");
  const [expanded, setExpanded] = useState(false);

  const cfg = STATUS_CONFIG[item.operational_status] ?? { label: "Pendiente", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" };
  const next = FLOW_NEXT[item.operational_status] as { status: string; label: string; icon: string } | undefined;

  function handleAdvance() {
    if (!next) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await advanceItemStatus(item.id, next.status);
      if ("error" in res && res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        setFeedback({ text: `Marcado como ${next.label}`, isError: false });
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  function handleIncident() {
    if (!incidentMsg.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await reportIncident(item.id, item.booking_id, incidentMsg);
      if ("error" in res && res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        setFeedback({ text: "Incidencia registrada", isError: false });
        setShowIncident(false);
        setIncidentMsg("");
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div className={`rounded-lg border bg-white shadow-sm transition-all ${item.operational_status === "incident" ? "border-red-200" : "border-gray-200"}`}>
      {/* Main row — mobile-first layout */}
      <div className="px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`h-3 w-3 shrink-0 rounded-full ${cfg.dot}`} />
          <Link href={`/reservas/${item.booking_id}`} className="shrink-0 font-mono text-xs font-bold text-brand-700 hover:underline sm:text-sm">
            {item.booking_code}
          </Link>

          {/* Route — desktop */}
          <div className="hidden min-w-0 flex-1 sm:block">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <span className="truncate font-medium">{item.pickup_name}</span>
              <span className="shrink-0 text-gray-400">→</span>
              <span className="truncate font-medium">{item.dropoff_name}</span>
            </div>
          </div>

          <span className="hidden shrink-0 text-sm text-gray-500 lg:block">{item.customer_name}</span>

          <span className="ml-auto shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 sm:ml-0">
            {item.bags_count} 🎒
          </span>

          <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-flex ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>

          {/* Desktop actions */}
          <div className="hidden items-center gap-1.5 sm:flex">
            {next && item.operational_status !== "incident" && (
              <button type="button" onClick={handleAdvance} disabled={pending}
                className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50">
                {pending ? "…" : `${next.icon} ${next.label}`}
              </button>
            )}
            {item.operational_status !== "delivered" && item.operational_status !== "incident" && (
              <button type="button" onClick={() => setShowIncident(!showIncident)}
                className="shrink-0 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50" title="Reportar incidencia">
                ⚠
              </button>
            )}
          </div>

          <button type="button" onClick={() => setExpanded(!expanded)}
            className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={expanded ? "Colapsar" : "Expandir"}>
            <svg className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Mobile: route + customer + status + action buttons */}
        <div className="mt-2 sm:hidden">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="truncate font-medium">{item.pickup_name}</span>
            <span className="text-gray-400">→</span>
            <span className="truncate font-medium">{item.dropoff_name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-400">{item.customer_name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          </div>
          {/* Mobile action buttons — large touch targets */}
          <div className="mt-2.5 flex gap-2">
            {next && item.operational_status !== "incident" && (
              <button type="button" onClick={handleAdvance} disabled={pending}
                className="flex-1 rounded-lg bg-brand-600 py-2.5 text-center text-sm font-semibold text-white shadow-sm active:bg-brand-700 disabled:opacity-50">
                {pending ? "…" : `${next.icon} ${next.label}`}
              </button>
            )}
            {item.operational_status !== "delivered" && item.operational_status !== "incident" && (
              <button type="button" onClick={() => setShowIncident(!showIncident)}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 active:bg-red-50">
                ⚠ Incidencia
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`border-t px-4 py-2 text-xs font-medium ${feedback.isError ? "border-red-100 bg-red-50 text-red-700" : "border-green-100 bg-green-50 text-green-700"}`}>
          {feedback.text}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Cliente</p>
              <p className="text-gray-700">{item.customer_name}</p>
              {item.customer_phone && (
                <a href={`tel:${item.customer_phone}`} className="text-xs text-brand-600 hover:underline">
                  {item.customer_phone}
                </a>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Estado reserva</p>
              <p className="text-gray-700 capitalize">{item.booking_status.replace(/_/g, " ")}</p>
            </div>
            {item.notes_customer && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-gray-400">Notas cliente</p>
                <p className="text-gray-600">{item.notes_customer}</p>
              </div>
            )}
            {item.notes_internal && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-gray-400">Notas internas</p>
                <p className="text-gray-600">{item.notes_internal}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incident form */}
      {showIncident && (
        <div className="border-t border-red-100 bg-red-50/50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-red-700">Reportar incidencia</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={incidentMsg}
              onChange={(e) => setIncidentMsg(e.target.value)}
              placeholder="Describe brevemente la incidencia..."
              maxLength={500}
              className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={handleIncident}
              disabled={pending || !incidentMsg.trim()}
              className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "…" : "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowIncident(false);
                setIncidentMsg("");
              }}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
