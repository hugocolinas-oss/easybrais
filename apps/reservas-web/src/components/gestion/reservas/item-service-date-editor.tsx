"use client";

import { useState, useTransition } from "react";
import { updateBookingItemServiceDate } from "@/app/gestion/(dashboard)/reservas/actions";

interface Props {
  itemId: string;
  serviceDate: string;
}

export function ItemServiceDateEditor({ itemId, serviceDate }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(serviceDate);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!value) {
      setError("Selecciona una fecha.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await updateBookingItemServiceDate(itemId, value);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setEditing(false);
    });
  }

  if (!editing) {
    const [year, month, day] = serviceDate.split("-");
    const label = year && month && day ? `${day}/${month}/${year}` : serviceDate;

    return (
      <button
        type="button"
        onClick={() => {
          setValue(serviceDate);
          setError(null);
          setEditing(true);
        }}
        className="group inline-flex items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-brand-50"
        title="Cambiar fecha del tramo"
      >
        <span className="text-gray-700">{label}</span>
        <svg className="h-3 w-3 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        disabled={pending}
        className="rounded border border-brand-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        autoFocus
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "..." : "OK"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={pending}
          className="text-[10px] text-gray-500 hover:text-gray-700"
        >
          X
        </button>
      </div>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
