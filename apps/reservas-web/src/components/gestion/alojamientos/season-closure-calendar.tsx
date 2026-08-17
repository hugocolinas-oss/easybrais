"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createServiceClosure, deleteServiceClosure } from "@/app/gestion/(dashboard)/alojamientos/actions";

export interface ServiceClosure {
  id: string;
  starts_on: string;
  ends_on: string;
  reason: string | null;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

function daysInRange(startsOn: string, endsOn: string): number {
  return Math.round((Date.parse(`${endsOn}T00:00:00Z`) - Date.parse(`${startsOn}T00:00:00Z`)) / 86_400_000) + 1;
}

export function SeasonClosureCalendar({ closures }: { closures: ServiceClosure[] }) {
  const router = useRouter();
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const count = new Date(year, monthIndex + 1, 0).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: count }, (_, index) => isoDate(year, monthIndex, index + 1)),
    ];
  }, [month]);

  function closureFor(date: string) {
    return closures.find((closure) => date >= closure.starts_on && date <= closure.ends_on);
  }

  function chooseDate(date: string) {
    setMessage(null);
    if (!startsOn || endsOn) {
      setStartsOn(date);
      setEndsOn("");
      return;
    }
    if (date < startsOn) {
      setStartsOn(date);
      return;
    }
    setEndsOn(date);
  }

  function saveClosure() {
    if (!startsOn) {
      setMessage({ kind: "error", text: "Selecciona el primer día del cierre." });
      return;
    }
    const finalDate = endsOn || startsOn;
    startTransition(async () => {
      const result = await createServiceClosure({ startsOn, endsOn: finalDate, reason });
      if ("error" in result) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setStartsOn("");
      setEndsOn("");
      setReason("");
      setMessage({ kind: "success", text: "Fechas cerradas para nuevas reservas públicas." });
      router.refresh();
    });
  }

  function reopen(id: string) {
    if (!window.confirm("¿Reabrir este rango para nuevas reservas públicas?")) return;
    startTransition(async () => {
      const result = await deleteServiceClosure(id);
      setMessage("error" in result
        ? { kind: "error", text: result.error }
        : { kind: "success", text: "El rango vuelve a estar disponible." });
      if (!("error" in result)) router.refresh();
    });
  }

  const finalSelection = endsOn || startsOn;

  return (
    <section className="overflow-hidden rounded-xl border border-brand-900/10 bg-white shadow-sm">
      <div className="border-b border-brand-900/10 bg-brand-50/70 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-white shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-brand-950">Calendario de temporada</h3>
            <p className="mt-0.5 text-xs leading-5 text-brand-800/65 sm:text-sm">
              Cierra uno o varios días para impedir nuevas reservas desde la web. Las reservas que ya existen no se modifican.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <div className="border-b border-gray-100 p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" aria-label="Mes anterior">←</button>
            <p className="text-sm font-bold capitalize text-gray-900">
              {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(month)}
            </p>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" aria-label="Mes siguiente">→</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => <span key={day} className="py-1 text-[10px] font-bold text-gray-400">{day}</span>)}
            {calendarDays.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />;
              const closed = closureFor(date);
              const selected = startsOn && finalSelection && date >= startsOn && date <= finalSelection;
              return (
                <button
                  type="button"
                  key={date}
                  onClick={() => chooseDate(date)}
                  title={closed?.reason || (closed ? "Cerrado" : undefined)}
                  className={`relative aspect-square rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${
                    selected ? "bg-brand-900 text-white" : closed ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200" : "text-gray-700 hover:bg-brand-50"
                  }`}
                >
                  {Number(date.slice(-2))}
                  {closed && !selected && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-red-500" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-900" /> Selección</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-red-200" /> Cerrado</span>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nuevo cierre</p>
            <p className="mt-2 min-h-10 text-sm font-semibold text-gray-900">
              {startsOn ? `${formatDate(startsOn)}${endsOn ? ` — ${formatDate(endsOn)}` : ""}` : "Selecciona el primer y el último día"}
            </p>
            <label className="mt-3 block text-xs font-semibold text-gray-600" htmlFor="closure-reason">Motivo (opcional)</label>
            <input id="closure-reason" value={reason} maxLength={200} onChange={(event) => setReason(event.target.value)} placeholder="Ej. Fin de temporada" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            <button type="button" onClick={saveClosure} disabled={pending || !startsOn} className="mt-3 w-full rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-45">
              {pending ? "Guardando…" : "Cerrar fechas"}
            </button>
            {message && <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-xs ${message.kind === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{message.text}</p>}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Rangos cerrados</p>
            {closures.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">No hay fechas cerradas.</p>
            ) : (
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {closures.map((closure) => (
                  <div key={closure.id} className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900">{formatDate(closure.starts_on)} — {formatDate(closure.ends_on)}</p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">{closure.reason || `${daysInRange(closure.starts_on, closure.ends_on)} días sin servicio`}</p>
                    </div>
                    <button type="button" disabled={pending} onClick={() => reopen(closure.id)} className="shrink-0 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Reabrir</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
