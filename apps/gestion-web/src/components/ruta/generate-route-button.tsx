"use client";

import { useTransition, useState } from "react";
import { generateRoute } from "@/app/(dashboard)/ruta/actions";

interface Props {
  date: string;
}

export function GenerateRouteButton({ date }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const res = await generateRoute(date);
      if ("error" in res && res.error) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
      <svg
        className="mx-auto h-12 w-12 text-gray-300"
        fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
        />
      </svg>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">
        No hay ruta generada para este día
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Genera la ruta automáticamente a partir de las reservas del día.
      </p>

      {error && (
        <div className="mx-auto mt-4 max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generando…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Generar ruta del día
          </>
        )}
      </button>
    </div>
  );
}
