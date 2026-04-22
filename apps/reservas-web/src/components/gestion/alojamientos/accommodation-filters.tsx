"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

interface Props {
  stages: string[];
}

export function AccommodationFilters({ stages }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(sp.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`/gestion/alojamientos?${next.toString()}`);
    },
    [router, sp],
  );

  function handleSearch(value: string) {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push("q", value), 300);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar nombre, código, localidad..."
          defaultValue={sp.get("q") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
      </div>

      <select
        defaultValue={sp.get("active") ?? ""}
        onChange={(e) => push("active", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Todos (estado)</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>

      <select
        defaultValue={sp.get("visible") ?? ""}
        onChange={(e) => push("visible", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Todos (visibilidad)</option>
        <option value="true">Visibles</option>
        <option value="false">Ocultos</option>
      </select>

      {stages.length > 0 && (
        <select
          defaultValue={sp.get("stage") ?? ""}
          onChange={(e) => push("stage", e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas las etapas</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
