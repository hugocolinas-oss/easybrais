"use client";

import { useState, useTransition } from "react";
import { resendReservationEmails } from "@/app/gestion/(dashboard)/reservas/actions";

interface Props {
  bookingId: string;
}

export function ResendEmailsButton({ bookingId }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await resendReservationEmails(bookingId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Emails reenviados.");
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.75 3.75a2.25 2.25 0 01-2.134 0l-6.75-3.75A2.25 2.25 0 013.75 9.906V9m18 0V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75V9m19.5 0l-8.69 4.828a2.25 2.25 0 01-2.12 0L2.25 9" />
        </svg>
        {pending ? "Reenviando..." : "Reenviar emails"}
      </button>
      {message && <p className="mt-1 text-xs text-green-700">{message}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
