"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@easybrais/utils";
import { requireAuth } from "@/lib/gestion/auth";
import { assertOperativeAccess, PermissionError } from "@/lib/gestion/permissions";
import { sendCustomerIncidentReportedEmail } from "@/lib/email/reservations";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ITEM_STATUS_FLOW = ["pending", "picked_up", "delivered"] as const;
const ALLOWED_ITEM_STATUSES = [...ITEM_STATUS_FLOW, "incident"] as const;

export async function advanceItemStatus(itemId: string, newStatus: string) {
  if (!UUID_RE.test(itemId)) return { error: "ID inválido." };

  const allowed: readonly string[] = ALLOWED_ITEM_STATUSES;
  if (!allowed.includes(newStatus)) return { error: "Estado no permitido." };

  try {
    const { userId, profile } = await requireAuth();
    assertOperativeAccess(profile.role);
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
    revalidatePath("/gestion/ruta");
    revalidatePath("/gestion");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[advanceItemStatus] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al actualizar el estado." };
  }
}

export async function reportIncident(
  itemId: string,
  bookingId: string,
  message: string,
): Promise<{ ok: true; warning?: string } | { error: string }> {
  if (!UUID_RE.test(itemId)) return { error: "ID inválido." };
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };
  if (!message.trim()) return { error: "Describe la incidencia." };
  if (message.length > 500) return { error: "Mensaje demasiado largo (máx 500 caracteres)." };

  try {
    const { userId, profile } = await requireAuth();
    assertOperativeAccess(profile.role);
    const supabase = createAdminClient();
    const trimmedMessage = message.trim();

    const { data: currentItem, error: itemFetchErr } = await supabase
      .from("booking_items")
      .select("operational_status")
      .eq("id", itemId)
      .single();

    if (itemFetchErr || !currentItem) {
      console.error("[reportIncident] item fetch failed:", itemFetchErr?.message);
      return { error: "No se pudo cargar el item." };
    }

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
      .update({
        status: "incident",
        incident_reason: trimmedMessage,
        incident_reported_at: new Date().toISOString(),
      } as never)
      .eq("id", bookingId);

    if (bookingErr) {
      console.error("[reportIncident] booking status update failed:", bookingErr.message);
      await supabase
        .from("booking_items")
        .update({ operational_status: currentItem.operational_status } as never)
        .eq("id", itemId);
      return { error: "No se pudo guardar la incidencia en la reserva." };
    }

    const warnings: string[] = [];

    const { error: eventErr } = await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "incident_reported" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: { item_id: itemId, message: trimmedMessage },
    });

    if (eventErr) {
      console.error("[reportIncident] event insert failed:", eventErr.message);
      warnings.push("Incidencia guardada, pero no se pudo registrar el evento en el historial.");
    }

    const emailResult = await sendCustomerIncidentReportedEmail(bookingId, message, supabase);
    if (!emailResult.sent && emailResult.error) {
      console.error("[reportIncident] incident email failed:", emailResult.error);
      warnings.push("Incidencia guardada, pero no se pudo enviar el email al cliente.");
    }

    revalidatePath("/gestion/operativa");
    revalidatePath("/gestion/reservas");
    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/ruta");
    revalidatePath("/gestion");
    return { ok: true, warning: warnings.length > 0 ? warnings.join(" ") : undefined };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
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
      .select("status, payment_status, payment_method")
      .eq("id", bookingId)
      .single();

    if (bookFetchErr || !booking) {
      if (bookFetchErr) console.error("[syncBookingStatus] fetch booking failed:", bookFetchErr.message);
      return;
    }

    const { status: currentStatus, payment_status: payStatus, payment_method: paymentMethod } = booking as {
      status: string;
      payment_status: string;
      payment_method: string | null;
    };

    const updates: Record<string, unknown> = {};

    if (currentStatus !== "cancelled" && currentStatus !== derivedBookingStatus) {
      updates.status = derivedBookingStatus;
    }

    if (derivedBookingStatus !== "incident" && currentStatus === "incident") {
      updates.incident_reason = null;
      updates.incident_reported_at = null;
    }

    const hasPickup = statuses.some((s) => s === "picked_up" || s === "delivered");
    if (hasPickup && payStatus !== "paid" && paymentMethod === "cash") {
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
        event_type: "payment_received" as const,
        actor_type: "system" as const,
        actor_id: userId,
        payload_json: { from: payStatus, to: "paid", reason: "auto_on_pickup" },
      });
    }
  } catch (err) {
    console.error("[syncBookingStatus] unexpected:", err instanceof Error ? err.message : err);
  }
}
