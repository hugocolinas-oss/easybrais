"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBooking } from "@/app/gestion/(dashboard)/reservas/actions";

interface Props {
  bookingId: string;
  bookingCode: string;
}

export function DeleteBookingButton({ bookingId, bookingCode }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteBooking(bookingId);
      if (res && "error" in res) {
        setError(res.error ?? "Error al eliminar la reserva.");
        setShowConfirm(false);
      } else {
        router.push("/gestion/reservas");
      }
    });
  }

  if (!showConfirm) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          Eliminar reserva
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3">
      <p className="text-xs font-medium text-red-800">
        Eliminar reserva <span className="font-bold">{bookingCode}</span>?
      </p>
      <p className="mt-1 text-[10px] text-red-600">
        Se borrarán todos los tramos, eventos y datos asociados. Esta acción no se puede deshacer.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={pending}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
