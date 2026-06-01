"use client";

import { useState, useTransition } from "react";
import { updateBookingItem } from "@/app/gestion/(dashboard)/reservas/actions";

interface Props {
  itemId: string;
  bagsCount: number;
  overweightBagsCount: number;
}

export function ItemBagsEditor({ itemId, bagsCount, overweightBagsCount }: Props) {
  const [editing, setEditing] = useState(false);
  const [bags, setBags] = useState(bagsCount);
  const [ow, setOw] = useState(overweightBagsCount);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setBags(bagsCount);
    setOw(overweightBagsCount);
    setError(null);
    setEditing(true);
  }

  function save() {
    if (bags < 0 || ow < 0) { setError("Valor inválido"); return; }
    if (ow > bags) { setError("Sobrepeso no puede superar mochilas"); return; }
    setError(null);
    startTransition(async () => {
      const res = await updateBookingItem(itemId, {
        bags_count: bags,
        overweight_bags_count: ow,
      });
      if (res && "error" in res) {
        setError(res.error ?? "Error al guardar.");
      } else {
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={open}
        className="group inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-brand-50"
        title="Editar mochilas"
      >
        <span className="font-medium text-gray-700">{bagsCount}</span>
        <svg className="h-3 w-3 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-gray-500">Moch.</label>
        <input
          type="number"
          min={0}
          max={99}
          value={bags}
          onChange={(e) => setBags(Math.max(0, parseInt(e.target.value) || 0))}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          disabled={pending}
          className="w-14 rounded border border-gray-300 px-1.5 py-0.5 text-center text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-gray-500">Sobre.</label>
        <input
          type="number"
          min={0}
          max={bags}
          value={ow}
          onChange={(e) => setOw(Math.max(0, parseInt(e.target.value) || 0))}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          disabled={pending}
          className="w-14 rounded border border-gray-300 px-1.5 py-0.5 text-center text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
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
