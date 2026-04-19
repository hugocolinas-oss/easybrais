import { getServerSupabase } from "@/lib/supabase/server";

export interface RouteStop {
  id: string;
  position: number;
  stop_type: "pickup" | "dropoff";
  accommodation_id: string | null;
  accommodation_name: string;
  accommodation_town: string | null;
  accommodation_address: string | null;
  booking_item_id: string | null;
  booking_code: string;
  booking_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  bags_count: number;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export interface RouteSummary {
  totalStops: number;
  pickupStops: number;
  dropoffStops: number;
  totalBags: number;
  completedStops: number;
  localities: { town: string; count: number }[];
}

export interface DailyRoute {
  id: string;
  route_date: string;
  status: string;
  notes: string | null;
  total_stops: number;
  total_bags: number;
  stops: RouteStop[];
  summary: RouteSummary;
}

interface RawRoute {
  id: string;
  route_date: string;
  status: string;
  notes: string | null;
  total_stops: number;
  total_bags: number;
}

interface RawStop {
  id: string;
  position: number;
  stop_type: string;
  accommodation_id: string | null;
  accommodation_name: string;
  accommodation_town: string | null;
  booking_item_id: string | null;
  booking_code: string;
  customer_name: string;
  bags_count: number;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export async function getRouteForDate(date: string): Promise<DailyRoute | null> {
  const supabase = await getServerSupabase();

  const { data: route } = await supabase
    .from("daily_routes")
    .select("id, route_date, status, notes, total_stops, total_bags")
    .eq("route_date", date)
    .single();

  if (!route) return null;
  const r = route as unknown as RawRoute;

  const { data: rawStops } = await supabase
    .from("daily_route_stops")
    .select(
      "id, position, stop_type, accommodation_id, accommodation_name, accommodation_town, booking_item_id, booking_code, customer_name, bags_count, completed, completed_at, notes",
    )
    .eq("route_id", r.id)
    .order("position", { ascending: true });

  const stopRows = (rawStops ?? []) as unknown as RawStop[];

  const accIds = [...new Set(stopRows.map((s) => s.accommodation_id).filter(Boolean))] as string[];
  const itemIds = [...new Set(stopRows.map((s) => s.booking_item_id).filter(Boolean))] as string[];

  const [{ data: accs }, { data: items }] = await Promise.all([
    accIds.length > 0
      ? supabase.from("accommodations").select("id, address").in("id", accIds)
      : Promise.resolve({ data: [] }),
    itemIds.length > 0
      ? supabase.from("booking_items").select("id, booking_id, bookings(id, customers(phone))").in("id", itemIds)
      : Promise.resolve({ data: [] }),
  ]);

  const addressMap = new Map((accs ?? []).map((a: { id: string; address: string | null }) => [a.id, a.address]));

  interface ItemWithBooking { id: string; booking_id: string | null; bookings: { id: string; customers: { phone: string | null } | null } | null }
  const itemMap = new Map(
    ((items ?? []) as unknown as ItemWithBooking[]).map((i) => [
      i.id,
      { booking_id: i.booking_id ?? i.bookings?.id ?? null, phone: i.bookings?.customers?.phone ?? null },
    ]),
  );

  const stops: RouteStop[] = stopRows.map((s) => {
    const itemInfo = s.booking_item_id ? itemMap.get(s.booking_item_id) : undefined;
    return {
      id: s.id,
      position: s.position,
      stop_type: s.stop_type as "pickup" | "dropoff",
      accommodation_id: s.accommodation_id,
      accommodation_name: s.accommodation_name,
      accommodation_town: s.accommodation_town,
      accommodation_address: s.accommodation_id ? addressMap.get(s.accommodation_id) ?? null : null,
      booking_item_id: s.booking_item_id,
      booking_code: s.booking_code,
      booking_id: itemInfo?.booking_id ?? null,
      customer_name: s.customer_name,
      customer_phone: itemInfo?.phone ?? null,
      bags_count: s.bags_count,
      completed: s.completed,
      completed_at: s.completed_at,
      notes: s.notes,
    };
  });

  const townCounts = new Map<string, number>();
  for (const s of stops) {
    const t = s.accommodation_town || "Sin localidad";
    townCounts.set(t, (townCounts.get(t) ?? 0) + 1);
  }

  const summary: RouteSummary = {
    totalStops: stops.length,
    pickupStops: stops.filter((s) => s.stop_type === "pickup").length,
    dropoffStops: stops.filter((s) => s.stop_type === "dropoff").length,
    totalBags: stops.reduce((sum, s) => sum + s.bags_count, 0),
    completedStops: stops.filter((s) => s.completed).length,
    localities: [...townCounts.entries()]
      .map(([town, count]) => ({ town, count }))
      .sort((a, b) => b.count - a.count),
  };

  return {
    id: r.id,
    route_date: r.route_date,
    status: r.status,
    notes: r.notes,
    total_stops: r.total_stops,
    total_bags: r.total_bags,
    stops,
    summary,
  };
}
