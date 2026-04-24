"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, PRICING_RULES } from "@easybrais/utils";
import { requireAuth } from "@/lib/gestion/auth";
import { OPERATIONAL_STATUSES } from "@/lib/gestion/booking-status";

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

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    revalidatePath("/gestion");
    return { ok: true };
  } catch (err) {
    console.error("[changeBookingStatus] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al cambiar el estado." };
  }
}

export async function updateBookingPrice(bookingId: string, newTotal: number) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };
  if (!Number.isFinite(newTotal) || newTotal < 0) return { error: "Precio inválido." };

  try {
    const { userId } = await requireAuth();
    const supabase = createAdminClient();

    const { data: current, error: fetchErr } = await supabase
      .from("bookings")
      .select("total_amount, subtotal_amount")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !current) return { error: "Reserva no encontrada." };

    const oldTotal = Number(current.total_amount);
    if (oldTotal === newTotal) return { ok: true };

    const { error } = await supabase
      .from("bookings")
      .update({
        total_amount: newTotal,
        subtotal_amount: newTotal,
      } as never)
      .eq("id", bookingId);

    if (error) {
      console.error("[updateBookingPrice] update failed:", error.message);
      return { error: "Error al actualizar el precio." };
    }

    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "price_updated" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: { from: oldTotal, to: newTotal },
    });

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    return { ok: true };
  } catch (err) {
    console.error("[updateBookingPrice] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}

export async function updateBookingItem(
  itemId: string,
  fields: { bags_count?: number; overweight_bags_count?: number },
) {
  if (!UUID_RE.test(itemId)) return { error: "ID de tramo inválido." };

  const bags = fields.bags_count;
  const ow = fields.overweight_bags_count;
  if (bags != null && (!Number.isInteger(bags) || bags < 0)) return { error: "Mochilas inválido." };
  if (ow != null && (!Number.isInteger(ow) || ow < 0)) return { error: "Sobrepeso inválido." };

  try {
    const { userId } = await requireAuth();
    const supabase = createAdminClient();

    const { data: item, error: fetchErr } = await supabase
      .from("booking_items")
      .select("id, booking_id, bags_count, overweight_bags_count, unit_price, line_total")
      .eq("id", itemId)
      .single();

    if (fetchErr || !item) return { error: "Tramo no encontrado." };

    const newBags = bags ?? item.bags_count;
    const newOw = ow ?? item.overweight_bags_count;
    const unitPrice = Number(item.unit_price) || 0;
    const newLineTotal = newBags * unitPrice;

    const { error: updateErr } = await supabase
      .from("booking_items")
      .update({
        bags_count: newBags,
        overweight_bags_count: newOw,
        line_total: newLineTotal,
      } as never)
      .eq("id", itemId);

    if (updateErr) {
      console.error("[updateBookingItem] item update failed:", updateErr.message);
      return { error: "Error al actualizar el tramo." };
    }

    const bookingId = item.booking_id as string;

    const { data: allItems } = await supabase
      .from("booking_items")
      .select("bags_count, overweight_bags_count, line_total")
      .eq("booking_id", bookingId);

    if (allItems) {
      const rows = allItems as { bags_count: number; overweight_bags_count: number; line_total: number }[];
      const subtotal = rows.reduce((s, r) => s + (Number(r.line_total) || 0), 0);
      const totalOw = rows.reduce((s, r) => s + (r.overweight_bags_count || 0), 0);
      const extraWeight = totalOw * PRICING_RULES.OVERWEIGHT_FEE;
      const total = subtotal + extraWeight;

      await supabase
        .from("bookings")
        .update({
          subtotal_amount: subtotal,
          extra_weight_amount: extraWeight,
          total_amount: total,
        } as never)
        .eq("id", bookingId);
    }

    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "item_updated" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: {
        item_id: itemId,
        bags: { from: item.bags_count, to: newBags },
        overweight: { from: item.overweight_bags_count, to: newOw },
      },
    });

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    return { ok: true };
  } catch (err) {
    console.error("[updateBookingItem] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
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

    revalidatePath(`/gestion/reservas/${bookingId}`);
    return { ok: true };
  } catch (err) {
    console.error("[updateInternalNotes] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al guardar las notas." };
  }
}

export async function deleteBooking(bookingId: string) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };

  try {
    const { userId } = await requireAuth();
    const supabase = createAdminClient();

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, booking_code, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { error: "Reserva no encontrada." };

    await supabase.from("booking_events").delete().eq("booking_id", bookingId);
    await supabase.from("booking_items").delete().eq("booking_id", bookingId);

    const { error: delErr } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (delErr) {
      console.error("[deleteBooking] delete failed:", delErr.message);
      return { error: "Error al eliminar la reserva." };
    }

    revalidatePath("/gestion/reservas");
    revalidatePath("/gestion");
    return { ok: true, deleted: true };
  } catch (err) {
    console.error("[deleteBooking] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al eliminar." };
  }
}
