"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { updateBookingItemAccommodation } from "@/app/gestion/(dashboard)/reservas/actions";

interface Accommodation {
  id: string;
  name: string;
  display_name: string;
  town: string | null;
}

interface Props {
  itemId: string;
  field: "pickup" | "dropoff";
  currentName: string;
  currentTown: string;
  accommodations: Accommodation[];
}

export function ItemAccommodationEditor({
  itemId,
  field,
  currentName,
  currentTown,
  accommodations,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return accommodations;
    const q = query.toLowerCase();
    return accommodations.filter(
      (a) =>
        a.display_name.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.town?.toLowerCase().includes(q),
    );
  }, [accommodations, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
        setQuery("");
      }
    }
    if (editing) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editing]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function open() {
    setQuery("");
    setError(null);
    setEditing(true);
  }

  function select(accId: string) {
    setError(null);
    startTransition(async () => {
      const res = await updateBookingItemAccommodation(itemId, field, accId);
      if (res && "error" in res) {
        setError(res.error ?? "Error al actualizar.");
      } else {
        setEditing(false);
        setQuery("");
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={open}
        className="group inline-flex items-center gap-1 text-left transition-colors hover:text-brand-700"
        title={`Cambiar ${field === "pickup" ? "recogida" : "entrega"}`}
      >
        <div>
          <p className="text-gray-900">{currentName}</p>
          {currentTown && <p className="text-xs text-gray-400">{currentTown}</p>}
        </div>
        <svg className="h-3 w-3 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative min-w-[200px]">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar alojamiento..."
        disabled={pending}
        className="w-full rounded-md border border-brand-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {error && <p className="mt-0.5 text-[10px] text-red-600">{error}</p>}
      <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-gray-400">Sin resultados</p>
        ) : (
          filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => select(a.id)}
              disabled={pending}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{a.display_name}</p>
                {a.town && <p className="truncate text-[10px] text-gray-400">{a.town}</p>}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
