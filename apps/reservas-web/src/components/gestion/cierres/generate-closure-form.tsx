"use client";

import { useState, useTransition } from "react";
import { generateClosure } from "@/app/gestion/(dashboard)/cierres/actions";

export function GenerateClosureForm() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0] ?? "";
  });
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  function handleGenerate() {
    if (!date) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await generateClosure(date);
      if ("error" in res && res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        setFeedback({ text: `Cierre generado para ${date}`, isError: false });
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
      <h3 className="text-sm font-semibold text-gray-900">Generar cierre contable</h3>
      <p className="mt-0.5 text-[10px] text-gray-500 sm:mt-1 sm:text-xs">
        Calcula automáticamente los totales del día seleccionado.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2 sm:mt-4 sm:gap-3">
        <div>
          <label htmlFor="closure-date" className="mb-1 block text-xs font-medium text-gray-600">
            Fecha del cierre
          </label>
          <input
            id="closure-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending || !date}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculando…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Generar cierre
            </>
          )}
        </button>
      </div>

      {feedback && (
        <p className={`mt-3 text-xs font-medium ${feedback.isError ? "text-red-600" : "text-green-600"}`}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
