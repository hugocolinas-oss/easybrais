"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@easybrais/utils";
import { requireAuth } from "@/lib/gestion/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ITEM_STATUS_FLOW = ["pending", "picked_up", "delivered"] as const;
const ALLOWED_ITEM_STATUSES = [...ITEM_STATUS_FLOW, "incident"] as const;

export async function advanceItemStatus(itemId: string, newStatus: string) {
  if (!UUID_RE.test(itemId)) return { error: "ID inválido." };

  const allowed: readonly string[] = ALLOWED_ITEM_STATUSES;
  if (!allowed.includes(newStatus)) return { error: "Estado no permitido." };

  try {
    const { userId } = await requireAuth();
    const supabase = createAdminClient();

    const { data: item, error: fetchErr } = await supabase
      .from("booking_items")
      .select("id, operational_status, booking_id")
      .eq("id", itemId)
      .single();

    if (fetchErr) {
      console.error("[advanceItemStatus] fetch failed:", fetchErr.message);
      return { error: "Error al consultar el item." };
    }
    if (!item) return { error: "Item no encontrado." };

    const oldStatus = (item as { operational_status: string }).operational_status;
    const bookingId = (item as { booking_id: string }).booking_id;

    if (oldStatus === newStatus) return { error: "Ya tiene ese estado." };

    const { error } = await supabase
      .from("booking_items")
      .update({ operational_status: newStatus } as never)
      .eq("id", itemId);

    if (error) {
      console.error("[advanceItemStatus] update failed:", error.message);
      return { error: "Error al actualizar el estado." };
    }

    const { error: eventErr } = await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "item_status_changed" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: { item_id: itemId, from: oldStatus, to: newStatus },
    });

    if (eventErr) {
      console.error("[advanceItemStatus] event insert failed:", eventErr.message);
    }

    await syncBookingStatus(supabase, bookingId, userId);

    revalidatePath("/gestion/operativa");
    revalidatePath("/gestion/reservas");
    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion");
    return { ok: true };
  } catch (err) {
    console.error("[advanceItemStatus] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al actualizar el estado." };
  }
}

export async function reportIncident(
  itemId: string,
  bookingId: string,
  message: string,
) {
  if (!UUID_RE.test(itemId)) return { error: "ID inválido." };
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };
  if (!message.trim()) return { error: "Describe la incidencia." };
  if (message.length > 500) return { error: "Mensaje demasiado largo (máx 500 caracteres)." };

  try {
    const { userId } = await requireAuth();
    const supabase = createAdminClient();

    const { error: itemErr } = await supabase
      .from("booking_items")
      .update({ operational_status: "incident" } as never)
      .eq("id", itemId);

    if (itemErr) {
      console.error("[reportIncident] item update failed:", itemErr.message);
      return { error: "Error al registrar la incidencia en el item." };
    }

    const { error: bookingErr } = await supabase
      .from("bookings")
      .update({ status: "incident" } as never)
      .eq("id", bookingId);

    if (bookingErr) {
      console.error("[reportIncident] booking status update failed:", bookingErr.message);
    }

    const { error: eventErr } = await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "incident_reported" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: { item_id: itemId, message: message.trim() },
    });

    if (eventErr) {
      console.error("[reportIncident] event insert failed:", eventErr.message);
    }

    revalidatePath("/gestion/operativa");
    revalidatePath("/gestion/reservas");
    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion");
    return { ok: true };
  } catch (err) {
    console.error("[reportIncident] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al registrar la incidencia." };
  }
}

async function syncBookingStatus(
  supabase: ReturnType<typeof createAdminClient>,
  bookingId: string,
  userId: string,
) {
  try {
    const { data: items, error: fetchErr } = await supabase
      .from("booking_items")
      .select("operational_status")
      .eq("booking_id", bookingId);

    if (fetchErr || !items || items.length === 0) {
      if (fetchErr) console.error("[syncBookingStatus] fetch items failed:", fetchErr.message);
      return;
    }

    const statuses = (items as { operational_status: string }[]).map(
      (i) => i.operational_status,
    );

    let derivedBookingStatus: string;

    if (statuses.every((s) => s === "delivered")) {
      derivedBookingStatus = "delivered";
    } else if (statuses.some((s) => s === "incident")) {
      derivedBookingStatus = "incident";
    } else if (statuses.some((s) => s === "picked_up")) {
      derivedBookingStatus = "in_pickup";
    } else {
      derivedBookingStatus = "confirmed";
    }

    const { data: booking, error: bookFetchErr } = await supabase
      .from("bookings")
      .select("status, payment_status")
      .eq("id", bookingId)
      .single();

    if (bookFetchErr || !booking) {
      if (bookFetchErr) console.error("[syncBookingStatus] fetch booking failed:", bookFetchErr.message);
      return;
    }

    const { status: currentStatus, payment_status: payStatus } = booking as {
      status: string;
      payment_status: string;
    };

    const updates: Record<string, unknown> = {};

    if (currentStatus !== "cancelled" && currentStatus !== derivedBookingStatus) {
      updates.status = derivedBookingStatus;
    }

    const hasPickup = statuses.some((s) => s === "picked_up" || s === "delivered");
    if (hasPickup && payStatus !== "paid") {
      updates.payment_status = "paid";
      updates.paid_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) return;

    const { error: updateErr } = await supabase
      .from("bookings")
      .update(updates as never)
      .eq("id", bookingId);

    if (updateErr) {
      console.error("[syncBookingStatus] update failed:", updateErr.message);
      return;
    }

    if (updates.status) {
      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: "status_changed" as const,
        actor_type: "system" as const,
        actor_id: userId,
        payload_json: {
          from: currentStatus,
          to: derivedBookingStatus,
          reason: "auto_sync_from_items",
        },
      });
    }

    if (updates.payment_status) {
      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: "payment_confirmed" as const,
        actor_type: "system" as const,
        actor_id: userId,
        payload_json: { from: payStatus, to: "paid", reason: "auto_on_pickup" },
      });
    }
  } catch (err) {
    console.error("[syncBookingStatus] unexpected:", err instanceof Error ? err.message : err);
  }
}
