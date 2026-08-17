"use server";

import { revalidatePath } from "next/cache";
import { PRICING_RULES } from "@easybrais/utils";
import { createAdminClient } from "@easybrais/utils/supabase/admin";
import { requireAuth } from "@/lib/gestion/auth";
import { OPERATIONAL_STATUSES } from "@/lib/gestion/booking-status";
import {
  assertBookingsAccess,
  assertCanDeleteBookings,
  assertCanEditBookingPricing,
  PermissionError,
} from "@/lib/gestion/permissions";
import { sendReservationEmails } from "@/lib/email/reservations";
import { refreshRoute } from "@/app/gestion/(dashboard)/ruta/actions";
import { getAccommodationLegIssue } from "@/lib/accommodation-order";
import {
  validateBookingCustomerUpdate,
  type BookingCustomerFields,
} from "@/lib/gestion/booking-customer-validation";
import type { RouteStage } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function changeBookingStatus(bookingId: string, newStatus: string) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };

  const allowed: readonly string[] = OPERATIONAL_STATUSES;
  if (!allowed.includes(newStatus)) return { error: "Estado no permitido." };

  try {
    const { userId, profile } = await requireAuth();
    assertBookingsAccess(profile.role);
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
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[changeBookingStatus] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al cambiar el estado." };
  }
}

export async function updateBookingPrice(bookingId: string, newTotal: number) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };
  if (!Number.isFinite(newTotal) || newTotal < 0) return { error: "Precio inválido." };

  try {
    const { userId, profile } = await requireAuth();
    assertBookingsAccess(profile.role);
    assertCanEditBookingPricing(profile.role);
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
      event_type: "updated" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: { kind: "price", from: oldTotal, to: newTotal },
    });

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[updateBookingPrice] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}

export async function updateBookingCustomer(
  bookingId: string,
  fields: BookingCustomerFields,
) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };
  const validation = validateBookingCustomerUpdate(fields);
  if (!validation.data) return { error: validation.error };
  const { fullName, email, phone, language, notes } = validation.data;

  try {
    const { userId, profile } = await requireAuth();
    assertBookingsAccess(profile.role);
    const supabase = createAdminClient();

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("customer_id, language, notes_customer, customers!inner(full_name, email, phone, language)")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { error: "Reserva no encontrada." };

    const currentCustomer = Array.isArray(booking.customers)
      ? booking.customers[0]
      : booking.customers;
    const customerId = booking.customer_id as string;

    const { error: customerErr } = await supabase
      .from("customers")
      .update({
        full_name: fullName,
        email,
        phone,
        language,
        notes: notes || null,
      })
      .eq("id", customerId);

    if (customerErr) {
      console.error("[updateBookingCustomer] customer update failed:", customerErr.message);
      return { error: "Error al actualizar los datos personales." };
    }

    const { error: bookingErr } = await supabase
      .from("bookings")
      .update({ language, notes_customer: notes || null } as never)
      .eq("id", bookingId);

    if (bookingErr) {
      console.error("[updateBookingCustomer] booking update failed:", bookingErr.message);
      return { error: "Error al actualizar los datos de la reserva." };
    }

    const changedFields = [
      currentCustomer?.full_name !== fullName && "full_name",
      currentCustomer?.email !== email && "email",
      currentCustomer?.phone !== phone && "phone",
      (currentCustomer?.language !== language || booking.language !== language) && "language",
      booking.notes_customer !== (notes || null) && "notes_customer",
    ].filter(Boolean);

    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "updated" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: { kind: "customer", changed_fields: changedFields },
    });

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    revalidatePath("/gestion");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[updateBookingCustomer] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al actualizar los datos personales." };
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
    const { userId, profile } = await requireAuth();
    assertBookingsAccess(profile.role);
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
      event_type: "updated" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: {
        kind: "booking_item",
        item_id: itemId,
        bags: { from: item.bags_count, to: newBags },
        overweight: { from: item.overweight_bags_count, to: newOw },
      },
    });

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[updateBookingItem] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}

export async function updateBookingItemServiceDate(itemId: string, serviceDate: string) {
  if (!UUID_RE.test(itemId)) return { error: "ID de tramo inválido." };
  if (!DATE_RE.test(serviceDate)) return { error: "Fecha inválida." };

  try {
    const { userId, profile } = await requireAuth();
    assertBookingsAccess(profile.role);
    const supabase = createAdminClient();

    const { data: item, error: fetchErr } = await supabase
      .from("booking_items")
      .select("id, booking_id, service_date, bookings!inner(service_date)")
      .eq("id", itemId)
      .single();

    if (fetchErr || !item) return { error: "Tramo no encontrado." };

    const currentDate = item.service_date as string;
    if (currentDate === serviceDate) return { ok: true };

    const bookingId = item.booking_id as string;
    const previousBookingServiceDate = (
      item as { bookings?: { service_date?: string | null } | Array<{ service_date?: string | null }> | null }
    ).bookings && !Array.isArray((item as { bookings?: unknown }).bookings)
      ? ((item as { bookings?: { service_date?: string | null } | null }).bookings?.service_date ?? currentDate)
      : currentDate;

    const { error: updateErr } = await supabase
      .from("booking_items")
      .update({ service_date: serviceDate } as never)
      .eq("id", itemId);

    if (updateErr) {
      console.error("[updateBookingItemServiceDate] item update failed:", updateErr.message);
      return { error: "Error al actualizar la fecha del tramo." };
    }

    const { data: bookingItems, error: itemsErr } = await supabase
      .from("booking_items")
      .select("service_date")
      .eq("booking_id", bookingId)
      .order("service_date", { ascending: true });

    if (itemsErr || !bookingItems || bookingItems.length === 0) {
      console.error("[updateBookingItemServiceDate] refetch items failed:", itemsErr?.message);
      return { error: "Error al recalcular la fecha de la reserva." };
    }

    const bookingServiceDate = bookingItems[0]!.service_date as string;

    const { error: bookingErr } = await supabase
      .from("bookings")
      .update({ service_date: bookingServiceDate } as never)
      .eq("id", bookingId);

    if (bookingErr) {
      console.error("[updateBookingItemServiceDate] booking update failed:", bookingErr.message);
      return { error: "Error al actualizar la reserva." };
    }

    try {
      await syncDailyArtifactsAfterDateChange(supabase, [currentDate, serviceDate]);
    } catch (syncErr) {
      console.error("[updateBookingItemServiceDate] artifact sync failed:", syncErr instanceof Error ? syncErr.message : syncErr);

      await supabase
        .from("booking_items")
        .update({ service_date: currentDate } as never)
        .eq("id", itemId);

      await supabase
        .from("bookings")
        .update({ service_date: previousBookingServiceDate } as never)
        .eq("id", bookingId);

      try {
        await syncDailyArtifactsAfterDateChange(supabase, [currentDate, serviceDate, previousBookingServiceDate]);
      } catch (rollbackErr) {
        console.error("[updateBookingItemServiceDate] rollback artifact sync failed:", rollbackErr instanceof Error ? rollbackErr.message : rollbackErr);
      }

      return { error: "No se pudo sincronizar la ruta o los cierres del día. No se han guardado cambios." };
    }

    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "updated" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: {
        kind: "service_date",
        item_id: itemId,
        from: currentDate,
        to: serviceDate,
      },
    });

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    revalidatePath("/gestion/operativa");
    revalidatePath("/gestion/ruta");
    revalidatePath("/gestion/cierres");
    revalidatePath("/gestion");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[updateBookingItemServiceDate] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al actualizar la fecha." };
  }
}

export async function updateBookingItemAccommodation(
  itemId: string,
  field: "pickup" | "dropoff",
  accommodationId: string,
) {
  if (!UUID_RE.test(itemId)) return { error: "ID de tramo inválido." };
  if (!UUID_RE.test(accommodationId)) return { error: "ID de alojamiento inválido." };

  try {
    const { userId, profile } = await requireAuth();
    assertBookingsAccess(profile.role);
    const supabase = createAdminClient();

    const { data: item, error: fetchErr } = await supabase
      .from("booking_items")
      .select("id, booking_id, pickup_accommodation_id, dropoff_accommodation_id")
      .eq("id", itemId)
      .single();

    if (fetchErr || !item) return { error: "Tramo no encontrado." };

    const col = field === "pickup" ? "pickup_accommodation_id" : "dropoff_accommodation_id";
    const oldId = field === "pickup" ? item.pickup_accommodation_id : item.dropoff_accommodation_id;

    if (oldId === accommodationId) return { ok: true };

    const pickupId = field === "pickup" ? accommodationId : item.pickup_accommodation_id;
    const dropoffId = field === "dropoff" ? accommodationId : item.dropoff_accommodation_id;
    if (pickupId && dropoffId) {
      const { data: routeAccommodations } = await supabase
        .from("accommodations")
        .select("id, external_code, route_stage:route_stages!accommodations_route_stage_id_fkey(code, name, route_section, branch_sequence, price_to_redondela)")
        .in("id", [pickupId, dropoffId]);
      type RouteAccommodation = { id: string; external_code: string | null; route_stage: RouteStage | null };
      const routeMap = new Map(((routeAccommodations ?? []) as unknown as RouteAccommodation[]).map((a) => [a.id, a]));
      const pickup = routeMap.get(pickupId);
      const dropoff = routeMap.get(dropoffId);
      if (pickup?.route_stage && dropoff?.route_stage) {
        const issue = getAccommodationLegIssue(pickup, dropoff);
        if (issue === "excess_mileage") {
          return { error: "Exceso de kilometraje: este trayecto no está disponible." };
        }
        if (issue === "reverse_direction") {
          return { error: "La recogida y la entrega están en sentido inverso." };
        }
      }
    }

    const { error: updateErr } = await supabase
      .from("booking_items")
      .update({ [col]: accommodationId } as never)
      .eq("id", itemId);

    if (updateErr) {
      console.error("[updateBookingItemAccommodation] update failed:", updateErr.message);
      return { error: "Error al actualizar el alojamiento." };
    }

    const { data: newAcc } = await supabase
      .from("accommodations")
      .select("name")
      .eq("id", accommodationId)
      .single();

    const bookingId = item.booking_id as string;
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "updated" as const,
      actor_type: "staff" as const,
      actor_id: userId,
      payload_json: {
        kind: "booking_item",
        item_id: itemId,
        field: `${field}_accommodation`,
        from: oldId,
        to: accommodationId,
        new_name: newAcc?.name ?? "—",
      },
    });

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    revalidatePath("/gestion/operativa");
    revalidatePath("/gestion/ruta");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[updateBookingItemAccommodation] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}

export async function updateInternalNotes(bookingId: string, notes: string) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };
  if (notes.length > 1000) return { error: "Las notas son demasiado largas." };

  try {
    const { userId, profile } = await requireAuth();
    assertBookingsAccess(profile.role);
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
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[updateInternalNotes] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al guardar las notas." };
  }
}

export async function deleteBooking(bookingId: string) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };

  try {
    const { profile } = await requireAuth();
    assertBookingsAccess(profile.role);
    assertCanDeleteBookings(profile.role);
    const supabase = createAdminClient();

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, booking_code, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { error: "Reserva no encontrada." };

    // 1. Obtener booking_items y sus fechas de servicio para regenerar cierres
    const { data: bookingItems } = await supabase
      .from("booking_items")
      .select("id, service_date")
      .eq("booking_id", bookingId);

    const itemIds = (bookingItems ?? []).map((i: { id: string }) => i.id);
    const affectedDates = [
      ...new Set(
        (bookingItems ?? [])
          .map((i: { service_date: string | null }) => i.service_date)
          .filter(Boolean) as string[],
      ),
    ];

    // 2. Eliminar paradas de ruta diaria que referencian estos items
    //    (daily_route_stops.booking_item_id no tiene ON DELETE CASCADE)
    if (itemIds.length > 0) {
      const { error: stopErr } = await supabase
        .from("daily_route_stops")
        .delete()
        .in("booking_item_id", itemIds);

      if (stopErr) {
        console.error("[deleteBooking] delete route stops failed:", stopErr.message);
      }
    }

    // 3. Eliminar eventos y items explícitamente
    await supabase.from("booking_events").delete().eq("booking_id", bookingId);
    await supabase.from("booking_items").delete().eq("booking_id", bookingId);

    // 4. Eliminar la reserva
    const { error: delErr } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (delErr) {
      console.error("[deleteBooking] delete failed:", delErr.message);
      return { error: "Error al eliminar la reserva." };
    }

    // 5. Regenerar cierres afectados para mantener totales correctos
    for (const date of affectedDates) {
      const { data: existingClosures } = await supabase
        .from("daily_cash_closures")
        .select("id")
        .eq("closure_date", date);

      if (existingClosures && existingClosures.length > 0) {
        for (const c of existingClosures) {
          await supabase.from("daily_cash_closures").delete().eq("id", c.id);
        }
        await regenerateClosureForDate(supabase, date);
      }
    }

    revalidatePath("/gestion/reservas");
    revalidatePath("/gestion/ruta");
    revalidatePath("/gestion/cierres");
    revalidatePath("/gestion/operativa");
    revalidatePath("/gestion");
    return { ok: true, deleted: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[deleteBooking] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al eliminar." };
  }
}

export async function resendReservationEmails(bookingId: string) {
  if (!UUID_RE.test(bookingId)) return { error: "ID de reserva inválido." };

  try {
    const { profile } = await requireAuth();
    assertBookingsAccess(profile.role);
    const supabase = createAdminClient();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return { error: "Reserva no encontrada." };
    }

    await sendReservationEmails(bookingId, supabase);

    revalidatePath(`/gestion/reservas/${bookingId}`);
    revalidatePath("/gestion/reservas");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[resendReservationEmails] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al reenviar emails." };
  }
}

const OVERWEIGHT_FEE = 5;
const PENDING_PAYMENT_STATUSES = new Set(["pending", "partial"]);

async function regenerateClosureForDate(
  supabase: ReturnType<typeof createAdminClient>,
  date: string,
) {
  const { data: items } = await supabase
    .from("booking_items")
    .select("bags_count, overweight_bags_count, line_total, bookings!inner(id, status, payment_status, subtotal_amount, discount_amount)")
    .eq("service_date", date);

  interface ClosureItem {
    bags_count: number;
    overweight_bags_count: number;
    line_total: number;
    bookings: {
      id: string;
      status: string;
      payment_status: string;
      subtotal_amount: number;
      discount_amount: number;
    };
  }

  const rows = (items ?? []) as unknown as ClosureItem[];
  if (rows.length === 0) return;

  const inactiveStatuses = new Set(["cancelled", "pending_payment", "payment_expired"]);
  const active = rows.filter((i) => !inactiveStatuses.has(i.bookings.status));
  const cancelledIds = new Set(
    rows.filter((i) => i.bookings.status === "cancelled").map((i) => i.bookings.id),
  );

  const activeBookingIds = new Set(active.map((i) => i.bookings.id));
  const totalBags = active.reduce((s, i) => s + (i.bags_count || 0), 0);
  const totalOverweight = active.reduce((s, i) => s + (i.overweight_bags_count || 0), 0);
  const extrasAmount = totalOverweight * OVERWEIGHT_FEE;
  const grossAmount = active.reduce((s, i) => s + (Number(i.line_total) || 0), 0);
  const discountsAmount = active.reduce((s, i) => {
    const subtotal = Number(i.bookings.subtotal_amount) || 0;
    const discount = Number(i.bookings.discount_amount) || 0;
    const line = Number(i.line_total) || 0;
    if (subtotal <= 0 || discount <= 0 || line <= 0) return s;
    return s + (line / subtotal) * discount;
  }, 0);

  const pendingItems = active.filter((i) => PENDING_PAYMENT_STATUSES.has(i.bookings.payment_status));
  const pendingCollectionAmount =
    pendingItems.reduce((s, i) => {
      const subtotal = Number(i.bookings.subtotal_amount) || 0;
      const discount = Number(i.bookings.discount_amount) || 0;
      const line = Number(i.line_total) || 0;
      const allocatedDiscount = subtotal > 0 && discount > 0 && line > 0
        ? (line / subtotal) * discount
        : 0;
      return s + line - allocatedDiscount;
    }, 0) +
    pendingItems.reduce((s, i) => s + (i.overweight_bags_count || 0), 0) * OVERWEIGHT_FEE;

  const { error } = await supabase.from("daily_cash_closures").insert({
    closure_date: date,
    total_bookings: activeBookingIds.size,
    total_bags: totalBags,
    gross_amount: grossAmount,
    discounts_amount: discountsAmount,
    extras_amount: extrasAmount,
    net_amount: grossAmount - discountsAmount + extrasAmount,
    pending_collection_amount: pendingCollectionAmount,
    cancellations_count: cancelledIds.size,
  });

  if (error) {
    throw new Error(`No se pudo regenerar el cierre del ${date}: ${error.message}`);
  }
}

async function syncDailyArtifactsAfterDateChange(
  supabase: ReturnType<typeof createAdminClient>,
  dates: string[],
) {
  const uniqueDates = [...new Set(dates.filter((date) => DATE_RE.test(date)))];

  for (const date of uniqueDates) {
    const { data: route } = await supabase
      .from("daily_routes")
      .select("id, route_date")
      .eq("route_date", date)
      .maybeSingle();

    if (route?.id && route.route_date) {
      const routeResult = await refreshRoute(route.id, route.route_date);
      if (routeResult && "error" in routeResult && routeResult.error) {
        throw new Error(routeResult.error);
      }
    }

    const { data: existingClosures } = await supabase
      .from("daily_cash_closures")
      .select("id")
      .eq("closure_date", date);

    const hadClosure = !!(existingClosures && existingClosures.length > 0);

    if (hadClosure) {
      for (const closure of existingClosures) {
        await supabase.from("daily_cash_closures").delete().eq("id", closure.id);
      }

      await regenerateClosureForDate(supabase, date);
    }
  }
}
