"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { assertClosuresAccess } from "@/lib/permissions";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RawBooking {
  id: string;
  status: string;
  subtotal_amount: number;
  discount_amount: number;
  extra_weight_amount: number;
  total_amount: number;
  payment_status: string;
  booking_items: Array<{ bags_count: number }>;
}

export async function generateClosure(date: string) {
  if (!DATE_RE.test(date)) return { error: "Fecha inválida." };

  try {
    const { profile } = await requireAuth();
    assertClosuresAccess(profile.role);
    const supabase = await getServerSupabase();

    const { data: existing, error: existErr } = await supabase
      .from("daily_cash_closures")
      .select("id")
      .eq("closure_date", date)
      .single();

    if (existErr && existErr.code !== "PGRST116") {
      console.error("[generateClosure] existing check failed:", existErr.message);
    }

    if (existing) {
      return { error: "Ya existe un cierre para este día. Elimínalo primero si quieres regenerar." };
    }

    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("id, status, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, booking_items(bags_count)")
      .eq("service_date", date);

    if (bookingsErr) {
      console.error("[generateClosure] fetch bookings failed:", bookingsErr.message);
      return { error: "Error al consultar las reservas del día." };
    }

    const rows = (bookings ?? []) as unknown as RawBooking[];

    const activeBookings = rows.filter((b) => b.status !== "cancelled");
    const cancelledBookings = rows.filter((b) => b.status === "cancelled");

    const totalBookings = activeBookings.length;
    const totalBags = activeBookings.reduce(
      (sum, b) =>
        sum +
        (Array.isArray(b.booking_items)
          ? b.booking_items.reduce((s, i) => s + (i.bags_count || 0), 0)
          : 0),
      0,
    );

    const grossAmount = activeBookings.reduce(
      (sum, b) => sum + (Number(b.subtotal_amount) || 0),
      0,
    );
    const discountsAmount = activeBookings.reduce(
      (sum, b) => sum + (Number(b.discount_amount) || 0),
      0,
    );
    const extrasAmount = activeBookings.reduce(
      (sum, b) => sum + (Number(b.extra_weight_amount) || 0),
      0,
    );
    const netAmount = activeBookings.reduce(
      (sum, b) => sum + (Number(b.total_amount) || 0),
      0,
    );
    const pendingCollectionAmount = activeBookings
      .filter((b) => b.payment_status === "pending")
      .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    const cancellationsCount = cancelledBookings.length;

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

    revalidatePath("/cierres");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("[generateClosure] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al generar el cierre." };
  }
}

export async function deleteClosure(closureId: string) {
  if (!UUID_RE.test(closureId)) return { error: "ID inválido." };

  try {
    const { profile } = await requireAuth();
    assertClosuresAccess(profile.role);
    const supabase = await getServerSupabase();

    const { error } = await supabase
      .from("daily_cash_closures")
      .delete()
      .eq("id", closureId);

    if (error) {
      console.error("[deleteClosure] delete failed:", error.message);
      return { error: "Error al eliminar el cierre." };
    }

    revalidatePath("/cierres");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("[deleteClosure] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al eliminar el cierre." };
  }
}
