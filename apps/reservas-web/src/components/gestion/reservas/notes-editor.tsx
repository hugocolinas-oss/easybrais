"use client";

import { useState, useTransition } from "react";
import { updateInternalNotes } from "@/app/gestion/(dashboard)/reservas/actions";

interface Props {
  bookingId: string;
  initialNotes: string;
}

export function NotesEditor({ bookingId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const dirty = notes !== savedNotes;

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateInternalNotes(bookingId, notes);
      if ("error" in result && result.error) {
        setFeedback({ text: result.error, isError: true });
      } else {
        setSavedNotes(notes);
        setFeedback({ text: "Guardado", isError: false });
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">Notas internas</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Notas visibles solo para el equipo…"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isPending}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {isPending ? "Guardando…" : "Guardar notas"}
        </button>
        {feedback && (
          <span className={`text-xs ${feedback.isError ? "text-red-600" : "text-green-600"}`}>
            {feedback.text}
          </span>
        )}
      </div>
    </div>
  );
}
