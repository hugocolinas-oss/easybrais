"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@easybrais/utils";
import { requireAuth } from "@/lib/auth";
import { OPERATIONAL_STATUSES } from "@/lib/booking-status";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function changeBookingStatus(bookingId: string, newStatus: string) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };

  const allowed: readonly string[] = OPERATIONAL_STATUSES;
  if (!allowed.includes(newStatus)) return { error: "Estado no permitido." };

  try {
    const { userId } = await requireAuth();
    const supabase = createAdminClient();

    const { data: current, error: fetchErr } = await supabase
      .from("bookings")
      .select("status")
      .eq("id", bookingId)
      .single();

    if (fetchErr) {
      console.error("[changeBookingStatus] fetch failed:", fetchErr.message);
      return { error: "Error al consultar la reserva." };
    }
    if (!current) return { error: "Reserva no encontrada." };

    const oldStatus = current.status;
    if (oldStatus === newStatus) return { error: "El estado ya es ese." };

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus } as never)
      .eq("id", bookingId);

    if (error) {
      console.error("[changeBookingStatus] update failed:", error.message);
      return { error: "Error al cambiar el estado." };
    }

    const { error: eventErr } = await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "status_changed" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: { from: oldStatus, to: newStatus },
    });

    if (eventErr) {
      console.error("[changeBookingStatus] event insert failed:", eventErr.message);
    }

    revalidatePath(`/reservas/${bookingId}`);
    revalidatePath("/reservas");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("[changeBookingStatus] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al cambiar el estado." };
  }
}

export async function updateInternalNotes(bookingId: string, notes: string) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };
  if (notes.length > 1000) return { error: "Las notas son demasiado largas." };

  try {
    const { userId } = await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("bookings")
      .update({ notes_internal: notes || null })
      .eq("id", bookingId);

    if (error) {
      console.error("[updateInternalNotes] update failed:", error.message);
      return { error: "Error al guardar las notas." };
    }

    const { error: eventErr } = await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "note_added" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: { notes_internal: notes || null },
    });

    if (eventErr) {
      console.error("[updateInternalNotes] event insert failed:", eventErr.message);
    }

    revalidatePath(`/reservas/${bookingId}`);
    return { ok: true };
  } catch (err) {
    console.error("[updateInternalNotes] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al guardar las notas." };
  }
}
