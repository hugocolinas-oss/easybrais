"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface RawBookingItem {
  id: string;
  bags_count: number;
  pickup_accommodation_id: string | null;
  dropoff_accommodation_id: string | null;
  pickup: { name: string; town: string | null } | null;
  dropoff: { name: string; town: string | null } | null;
  bookings: { booking_code: string; customers: { full_name: string } | null } | null;
}

export async function generateRoute(date: string) {
  if (!DATE_RE.test(date)) return { error: "Fecha inválida." };

  try {
    const { userId } = await requireAuth();
    const supabase = await getServerSupabase();

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
         pickup:pickup_accommodation_id(name, town),
         dropoff:dropoff_accommodation_id(name, town),
         bookings!inner(booking_code, customers(full_name))`,
      )
      .eq("service_date", date);

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
      booking_item_id: string;
      booking_code: string;
      customer_name: string;
      bags_count: number;
    }> = [];

    const dropoffStops: typeof pickupStops = [];

    for (const item of rows) {
      const code = item.bookings?.booking_code ?? "—";
      const customer = item.bookings?.customers?.full_name ?? "—";

      pickupStops.push({
        stop_type: "pickup",
        accommodation_id: item.pickup_accommodation_id,
        accommodation_name: item.pickup?.name ?? "—",
        accommodation_town: item.pickup?.town ?? null,
        booking_item_id: item.id,
        booking_code: code,
        customer_name: customer,
        bags_count: item.bags_count,
      });

      dropoffStops.push({
        stop_type: "dropoff",
        accommodation_id: item.dropoff_accommodation_id,
        accommodation_name: item.dropoff?.name ?? "—",
        accommodation_town: item.dropoff?.town ?? null,
        booking_item_id: item.id,
        booking_code: code,
        customer_name: customer,
        bags_count: item.bags_count,
      });
    }

    const allStops = [...pickupStops, ...dropoffStops];
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
      ...stop,
    }));

    const { error: stopsErr } = await supabase
      .from("daily_route_stops")
      .insert(stopsToInsert);

    if (stopsErr) {
      console.error("[generateRoute] stops insert failed:", stopsErr.message);
      await supabase.from("daily_routes").delete().eq("id", routeId);
      return { error: "Error al crear las paradas." };
    }

    revalidatePath("/ruta");
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
    const supabase = await getServerSupabase();

    const { error } = await supabase
      .from("daily_routes")
      .delete()
      .eq("id", routeId);

    if (error) {
      console.error("[deleteRoute] delete failed:", error.message);
      return { error: "Error al eliminar la ruta." };
    }

    revalidatePath("/ruta");
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
    const supabase = await getServerSupabase();

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

    revalidatePath("/ruta");
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
    const supabase = await getServerSupabase();

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

    revalidatePath("/ruta");
    return { ok: true };
  } catch (err) {
    console.error("[toggleStopCompleted] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}

export async function updateRouteStatus(routeId: string, status: string) {
  if (!UUID_RE.test(routeId)) return { error: "ID inválido." };
  if (!["draft", "active", "completed"].includes(status))
    return { error: "Estado no válido." };

  try {
    await requireAuth();
    const supabase = await getServerSupabase();

    const { error } = await supabase
      .from("daily_routes")
      .update({ status } as never)
      .eq("id", routeId);

    if (error) {
      console.error("[updateRouteStatus] update failed:", error.message);
      return { error: "Error al actualizar estado." };
    }

    revalidatePath("/ruta");
    return { ok: true };
  } catch (err) {
    console.error("[updateRouteStatus] unexpected:", err instanceof Error ? err.message : err);
    return { error: "Error inesperado." };
  }
}
