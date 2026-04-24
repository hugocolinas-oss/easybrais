"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAccommodation } from "@/app/gestion/(dashboard)/alojamientos/actions";

interface Props {
  id: string;
  name: string;
}

export function DeleteAccommodationButton({ id, name }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteAccommodation(id);
      if ("error" in res) {
        setError(res.error);
        setConfirm(false);
        return;
      }
      router.push("/gestion/alojamientos");
    });
  }

  if (!confirm) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Eliminar alojamiento
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-800">
        ¿Eliminar <strong>{name}</strong>? Esta acción no se puede deshacer.
      </p>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "Eliminando..." : "Confirmar eliminación"}
        </button>
        <button
          type="button"
          onClick={() => { setConfirm(false); setError(null); }}
          disabled={isPending}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
