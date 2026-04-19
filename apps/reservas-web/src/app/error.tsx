"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[reservas-web]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-sm rounded-2xl border border-red-200/80 bg-white p-8 shadow-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-bold text-brand-900">
          Algo ha ido mal
        </h2>
        <p className="mb-6 text-sm text-brand-800/50">
          Ha ocurrido un error inesperado. Puedes intentar de nuevo.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
