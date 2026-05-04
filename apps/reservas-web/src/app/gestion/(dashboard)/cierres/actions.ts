"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@easybrais/utils";
import { requireAuth } from "@/lib/gestion/auth";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RawItem {
  bags_count: number;
  overweight_bags_count: number;
  line_total: number;
  bookings: {
    id: string;
    status: string;
    payment_status: string;
  };
}

const OVERWEIGHT_FEE = 5;

export async function generateClosure(date: string) {
  if (!DATE_RE.test(date)) return { error: "Fecha inválida." };

  try {
    await requireAuth();
    const supabase = createAdminClient();

    const { data: existingRows } = await supabase
      .from("daily_cash_closures")
      .select("id")
      .eq("closure_date", date);

    if (existingRows && existingRows.length > 0) {
      for (const row of existingRows) {
        await supabase.from("daily_cash_closures").delete().eq("id", row.id);
      }
    }

    const { data: items, error: itemsErr } = await supabase
      .from("booking_items")
      .select("bags_count, overweight_bags_count, line_total, bookings!inner(id, status, payment_status)")
      .eq("service_date", date);

    if (itemsErr) {
      console.error("[generateClosure] fetch items failed:", itemsErr.message);
      return { error: "Error al consultar los tramos del día." };
    }

    const rows = (items ?? []) as unknown as RawItem[];

    const activeItems = rows.filter((i) => i.bookings.status !== "cancelled");
    const cancelledBookingIds = new Set(
      rows.filter((i) => i.bookings.status === "cancelled").map((i) => i.bookings.id),
    );

    const activeBookingIds = new Set(activeItems.map((i) => i.bookings.id));
    const totalBookings = activeBookingIds.size;

    const totalBags = activeItems.reduce((s, i) => s + (i.bags_count || 0), 0);

    const totalOverweight = activeItems.reduce((s, i) => s + (i.overweight_bags_count || 0), 0);
    const extrasAmount = totalOverweight * OVERWEIGHT_FEE;

    const grossAmount = activeItems.reduce((s, i) => s + (Number(i.line_total) || 0), 0);
    const netAmount = grossAmount + extrasAmount;
    const discountsAmount = 0;

    const pendingBookingIds = new Set(
      activeItems.filter((i) => i.bookings.payment_status === "pending").map((i) => i.bookings.id),
    );
    const pendingItems = activeItems.filter((i) => pendingBookingIds.has(i.bookings.id));
    const pendingCollectionAmount = pendingItems.reduce((s, i) => s + (Number(i.line_total) || 0), 0) +
      pendingItems.reduce((s, i) => s + (i.overweight_bags_count || 0), 0) * OVERWEIGHT_FEE;

    const cancellationsCount = cancelledBookingIds.size;

    const { error } = await supabase.from("daily_cash_closures").insert({
      closure_date: date,
      total_bookings: totalBookings,
      total_bags: totalBags,
      gross_amount: grossAmount,
      discounts_amount: discountsAmount,
      extras_amount: extrasAmount,
      net_amount: netAmount,
      pending_collection_amount: pendingCollectionAmount,
      cancellations_count: cancellationsCount,
    });

    if (error) {
      console.error("[generateClosure] insert failed:", error.message);
      return { error: "Error al guardar el cierre." };
    }

    revalidatePath("/gestion/cierres");
    revalidatePath("/gestion");
    return { ok: true };
  } catch (err) {
    console.error("[generateClosure] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al generar el cierre." };
  }
}

export interface ClosureBookingRow {
  booking_code: string;
  customer_name: string;
  route: string;
  bags_count: number;
  total_amount: number;
  payment_status: string;
}

export async function getClosureBookings(date: string): Promise<{ rows: ClosureBookingRow[] } | { error: string }> {
  if (!DATE_RE.test(date)) return { error: "Fecha inválida." };

  try {
    await requireAuth();
    const supabase = createAdminClient();

    const { data: items, error: fetchErr } = await supabase
      .from("booking_items")
      .select(
        `bags_count, overweight_bags_count, line_total,
         pickup:accommodations!booking_items_pickup_accommodation_id_fkey(name),
         dropoff:accommodations!booking_items_dropoff_accommodation_id_fkey(name),
         bookings!inner(id, booking_code, status, payment_status, customers(full_name))`,
      )
      .eq("service_date", date);

    if (fetchErr) {
      console.error("[getClosureBookings] fetch failed:", fetchErr.message);
      return { error: "Error al consultar reservas." };
    }

    interface RawPdfItem {
      bags_count: number;
      overweight_bags_count: number;
      line_total: number;
      pickup: { name: string } | null;
      dropoff: { name: string } | null;
      bookings: {
        id: string;
        booking_code: string;
        status: string;
        payment_status: string;
        customers: { full_name: string } | null;
      };
    }

    const raw = (items ?? []) as unknown as RawPdfItem[];
    const active = raw.filter((i) => i.bookings.status !== "cancelled");

    /* ── Agrupar por reserva, sumando SOLO las líneas del día ──────
       (evita duplicar el total de Camino completo en cada cierre) */
    const bookingMap = new Map<
      string,
      ClosureBookingRow & { route_pickup: string; route_dropoff: string }
    >();

    for (const item of active) {
      const bId = item.bookings.id;
      const lineAmount =
        (Number(item.line_total) || 0) +
        (item.overweight_bags_count || 0) * OVERWEIGHT_FEE;

      const existing = bookingMap.get(bId);
      if (existing) {
        existing.bags_count += item.bags_count || 0;
        existing.total_amount += lineAmount;
        existing.route_dropoff = item.dropoff?.name ?? existing.route_dropoff;
      } else {
        bookingMap.set(bId, {
          booking_code: item.bookings.booking_code,
          customer_name: item.bookings.customers?.full_name ?? "—",
          route_pickup: item.pickup?.name ?? "—",
          route_dropoff: item.dropoff?.name ?? "—",
          route: `${item.pickup?.name ?? "—"} → ${item.dropoff?.name ?? "—"}`,
          bags_count: item.bags_count || 0,
          total_amount: lineAmount,
          payment_status: item.bookings.payment_status,
        });
      }
    }

    const rows: ClosureBookingRow[] = Array.from(bookingMap.values()).map((b) => ({
      booking_code: b.booking_code,
      customer_name: b.customer_name,
      route: `${b.route_pickup} → ${b.route_dropoff}`,
      bags_count: b.bags_count,
      total_amount: b.total_amount,
      payment_status: b.payment_status,
    }));

    return { rows };
  } catch (err) {
    console.error("[getClosureBookings] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}

export async function deleteClosure(closureId: string) {
  if (!UUID_RE.test(closureId)) return { error: "ID inválido." };

  try {
    await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("daily_cash_closures")
      .delete()
      .eq("id", closureId);

    if (error) {
      console.error("[deleteClosure] delete failed:", error.message);
      return { error: "Error al eliminar el cierre." };
    }

    revalidatePath("/gestion/cierres");
    revalidatePath("/gestion");
    return { ok: true };
  } catch (err) {
    console.error("[deleteClosure] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al eliminar el cierre." };
  }
}
