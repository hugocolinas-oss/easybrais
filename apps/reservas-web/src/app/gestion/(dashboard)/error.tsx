"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[gestion-dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 max-w-md">
        <h2 className="mb-2 text-lg font-semibold text-red-800">
          Error al cargar
        </h2>
        <p className="mb-4 text-sm text-red-600">
          No se han podido cargar los datos. Comprueba tu conexión e inténtalo de nuevo.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
