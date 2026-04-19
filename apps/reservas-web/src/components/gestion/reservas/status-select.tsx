"use client";

import { useState, useTransition } from "react";
import { OPERATIONAL_STATUSES, getStatusConfig } from "@/lib/gestion/booking-status";
import { changeBookingStatus } from "@/app/gestion/(dashboard)/reservas/actions";

interface Props {
  bookingId: string;
  currentStatus: string;
}

export function StatusSelect({ bookingId, currentStatus }: Props) {
  const [selected, setSelected] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    setSelected(newStatus);
    setFeedback(null);

    startTransition(async () => {
      const result = await changeBookingStatus(bookingId, newStatus);
      if ("error" in result && result.error) {
        setFeedback({ text: result.error, isError: true });
        setSelected(currentStatus);
      } else {
        setFeedback({ text: "Estado actualizado", isError: false });
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">Cambiar estado</label>
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
      >
        {OPERATIONAL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {getStatusConfig(s).label}
          </option>
        ))}
      </select>
      {feedback && (
        <p className={`mt-1 text-xs ${feedback.isError ? "text-red-600" : "text-green-600"}`}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
