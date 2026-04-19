"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  stages: string[];
}

export function AccommodationFilters({ stages }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(sp.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`/alojamientos?${next.toString()}`);
    },
    [router, sp],
  );

  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="text"
        placeholder="Buscar nombre, código, localidad..."
        defaultValue={sp.get("q") ?? ""}
        onChange={(e) => push("q", e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 sm:w-64"
      />

      <select
        defaultValue={sp.get("active") ?? ""}
        onChange={(e) => push("active", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Todos (activo)</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>

      <select
        defaultValue={sp.get("visible") ?? ""}
        onChange={(e) => push("visible", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Todos (visibilidad)</option>
        <option value="true">Visibles en reservas</option>
        <option value="false">Ocultos en reservas</option>
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
