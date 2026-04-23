"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@easybrais/utils";
import { requireAuth } from "@/lib/gestion/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface RawBookingItem {
  id: string;
  bags_count: number;
  pickup_accommodation_id: string | null;
  dropoff_accommodation_id: string | null;
  pickup: { name: string; town: string | null; external_code: string | null } | null;
  dropoff: { name: string; town: string | null; external_code: string | null } | null;
  bookings: { booking_code: string; status: string; customers: { full_name: string; phone: string | null } | null } | null;
}

function parseStageCode(code: string | null): [number, number] {
  if (!code) return [9999, 9999];
  const parts = code.split(".");
  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1] ?? "0", 10);
  return [Number.isNaN(a) ? 9999 : a, Number.isNaN(b) ? 9999 : b];
}

export async function generateRoute(date: string) {
  if (!DATE_RE.test(date)) return { error: "Fecha inválida." };

  try {
    const { userId } = await requireAuth();
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("daily_routes")
      .select("id")
      .eq("route_date", date)
      .single();

    if (existing) {
      return { error: "Ya existe una ruta para este día. Elimínala primero si quieres regenerar." };
    }

    const { data: items, error: fetchErr } = await supabase
      .from("booking_items")
      .select(
        `id, bags_count, pickup_accommodation_id, dropoff_accommodation_id,
         pickup:accommodations!booking_items_pickup_accommodation_id_fkey(name, town, external_code),
         dropoff:accommodations!booking_items_dropoff_accommodation_id_fkey(name, town, external_code),
         bookings!inner(booking_code, status, customers(full_name, phone))`,
      )
      .eq("service_date", date)
      .not("bookings.status", "in", "(cancelled,payment_expired)");

    if (fetchErr) {
      console.error("[generateRoute] fetch items failed:", fetchErr.message);
      return { error: "Error al consultar las reservas del día." };
    }

    const rows = (items ?? []) as unknown as RawBookingItem[];

    if (rows.length === 0) {
      return { error: "No hay reservas para este día." };
    }

    const pickupStops: Array<{
      stop_type: string;
      accommodation_id: string | null;
      accommodation_name: string;
      accommodation_town: string | null;
      accommodation_code: string | null;
      booking_item_id: string;
      booking_code: string;
      customer_name: string;
      customer_phone: string | null;
      bags_count: number;
    }> = [];

    const dropoffStops: typeof pickupStops = [];

    for (const item of rows) {
      const code = item.bookings?.booking_code ?? "—";
      const customer = item.bookings?.customers?.full_name ?? "—";
      const phone = item.bookings?.customers?.phone ?? null;

      pickupStops.push({
        stop_type: "pickup",
        accommodation_id: item.pickup_accommodation_id,
        accommodation_name: item.pickup?.name ?? "—",
        accommodation_town: item.pickup?.town ?? null,
        accommodation_code: item.pickup?.external_code ?? null,
        booking_item_id: item.id,
        booking_code: code,
        customer_name: customer,
        customer_phone: phone,
        bags_count: item.bags_count,
      });

      dropoffStops.push({
        stop_type: "dropoff",
        accommodation_id: item.dropoff_accommodation_id,
        accommodation_name: item.dropoff?.name ?? "—",
        accommodation_town: item.dropoff?.town ?? null,
        accommodation_code: item.dropoff?.external_code ?? null,
        booking_item_id: item.id,
        booking_code: code,
        customer_name: customer,
        customer_phone: phone,
        bags_count: item.bags_count,
      });
    }

    const allStops = [...pickupStops, ...dropoffStops];

    allStops.sort((a, b) => {
      const [a1, a2] = parseStageCode(a.accommodation_code);
      const [b1, b2] = parseStageCode(b.accommodation_code);
      if (a1 !== b1) return a1 - b1;
      if (a2 !== b2) return a2 - b2;
      if (a.stop_type !== b.stop_type) return a.stop_type === "pickup" ? -1 : 1;
      return 0;
    });
    const totalBags = rows.reduce((s, i) => s + i.bags_count, 0);

    const { data: route, error: routeErr } = await supabase
      .from("daily_routes")
      .insert({
        route_date: date,
        status: "draft",
        total_stops: allStops.length,
        total_bags: totalBags,
        created_by: userId,
      })
      .select("id")
      .single();

    if (routeErr || !route) {
      console.error("[generateRoute] route insert failed:", routeErr?.message);
      return { error: "Error al crear la ruta." };
    }

    const routeId = (route as { id: string }).id;

    const stopsToInsert = allStops.map((stop, i) => ({
      route_id: routeId,
      position: i + 1,
      stop_type: stop.stop_type,
      accommodation_id: stop.accommodation_id,
      accommodation_name: stop.accommodation_name,
      accommodation_town: stop.accommodation_town,
      booking_item_id: stop.booking_item_id,
      booking_code: stop.booking_code,
      customer_name: stop.customer_name,
      bags_count: stop.bags_count,
    }));

    const { error: stopsErr } = await supabase
      .from("daily_route_stops")
      .insert(stopsToInsert);

    if (stopsErr) {
      console.error("[generateRoute] stops insert failed:", stopsErr.message);
      await supabase.from("daily_routes").delete().eq("id", routeId);
      return { error: "Error al crear las paradas." };
    }

    revalidatePath("/gestion/ruta");
    return { ok: true };
  } catch (err) {
    console.error("[generateRoute] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al generar la ruta." };
  }
}

export async function deleteRoute(routeId: string) {
  if (!UUID_RE.test(routeId)) return { error: "ID inválido." };

  try {
    await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("daily_routes")
      .delete()
      .eq("id", routeId);

    if (error) {
      console.error("[deleteRoute] delete failed:", error.message);
      return { error: "Error al eliminar la ruta." };
    }

    revalidatePath("/gestion/ruta");
    return { ok: true };
  } catch (err) {
    console.error("[deleteRoute] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al eliminar la ruta." };
  }
}

export async function swapStopPositions(
  routeId: string,
  stopId: string,
  direction: "up" | "down",
) {
  if (!UUID_RE.test(routeId) || !UUID_RE.test(stopId))
    return { error: "ID inválido." };

  try {
    await requireAuth();
    const supabase = createAdminClient();

    const { data: stops, error: fetchErr } = await supabase
      .from("daily_route_stops")
      .select("id, position")
      .eq("route_id", routeId)
      .order("position", { ascending: true });

    if (fetchErr || !stops) {
      console.error("[swapStopPositions] fetch failed:", fetchErr?.message);
      return { error: "Error al leer las paradas." };
    }

    const rows = stops as { id: string; position: number }[];
    const idx = rows.findIndex((s) => s.id === stopId);
    if (idx === -1) return { error: "Parada no encontrada." };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rows.length)
      return { error: "No se puede mover más." };

    const a = rows[idx]!;
    const b = rows[swapIdx]!;
    const tempPos = rows.length + 100;

    const { error: e1 } = await supabase
      .from("daily_route_stops")
      .update({ position: tempPos } as never)
      .eq("id", a.id);

    if (e1) {
      console.error("[swapStopPositions] step 1 failed:", e1.message);
      return { error: "Error al reordenar las paradas." };
    }

    const { error: e2 } = await supabase
      .from("daily_route_stops")
      .update({ position: a.position } as never)
      .eq("id", b.id);

    if (e2) {
      console.error("[swapStopPositions] step 2 failed:", e2.message);
      await supabase.from("daily_route_stops").update({ position: a.position } as never).eq("id", a.id);
      return { error: "Error al reordenar las paradas." };
    }

    const { error: e3 } = await supabase
      .from("daily_route_stops")
      .update({ position: b.position } as never)
      .eq("id", a.id);

    if (e3) {
      console.error("[swapStopPositions] step 3 failed:", e3.message);
      return { error: "Error al reordenar las paradas. Posible estado inconsistente." };
    }

    revalidatePath("/gestion/ruta");
    return { ok: true };
  } catch (err) {
    console.error("[swapStopPositions] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado al reordenar." };
  }
}

export async function toggleStopCompleted(stopId: string, completed: boolean) {
  if (!UUID_RE.test(stopId)) return { error: "ID inválido." };

  try {
    await requireAuth();
    const supabase = createAdminClient();

    const update: Record<string, unknown> = {
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("daily_route_stops")
      .update(update as never)
      .eq("id", stopId);

    if (error) {
      console.error("[toggleStopCompleted] update failed:", error.message);
      return { error: "Error al actualizar." };
    }

    revalidatePath("/gestion/ruta");
    return { ok: true };
  } catch (err) {
    console.error("[toggleStopCompleted] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}

export async function reorderStops(
  routeId: string,
  orderedStopIds: string[],
) {
  if (!UUID_RE.test(routeId)) return { error: "ID inválido." };

  try {
    await requireAuth();
    const supabase = createAdminClient();

    for (let i = 0; i < orderedStopIds.length; i++) {
      const { error } = await supabase
        .from("daily_route_stops")
        .update({ position: i + 1 } as never)
        .eq("id", orderedStopIds[i]!)
        .eq("route_id", routeId);

      if (error) {
        console.error("[reorderStops] update failed:", error.message);
        return { error: "Error al reordenar." };
      }
    }

    revalidatePath("/gestion/ruta");
    return { ok: true };
  } catch (err) {
    console.error("[reorderStops] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}

export async function updateRouteStatus(routeId: string, status: string) {
  if (!UUID_RE.test(routeId)) return { error: "ID inválido." };
  if (!["draft", "active", "completed"].includes(status))
    return { error: "Estado no válido." };

  try {
    await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("daily_routes")
      .update({ status } as never)
      .eq("id", routeId);

    if (error) {
      console.error("[updateRouteStatus] update failed:", error.message);
      return { error: "Error al actualizar estado." };
    }

    revalidatePath("/gestion/ruta");
    return { ok: true };
  } catch (err) {
    console.error("[updateRouteStatus] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}
