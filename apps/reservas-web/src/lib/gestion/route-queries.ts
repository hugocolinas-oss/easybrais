import { getServerSupabase } from "@/lib/supabase/server";

export interface RouteStop {
  id: string;
  position: number;
  stop_type: "pickup" | "dropoff";
  accommodation_id: string | null;
  accommodation_name: string;
  accommodation_town: string | null;
  accommodation_address: string | null;
  accommodation_internal_notes: string | null;
  accommodation_phone: string | null;
  booking_item_id: string | null;
  booking_code: string;
  booking_id: string | null;
  booking_status: string | null;
  source_channel: string | null;
  payment_status: string | null;
  payment_method: string | null;
  incident_reason: string | null;
  customer_name: string;
  customer_phone: string | null;
  bags_count: number;
  booking_total: number | null;
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
      ? supabase.from("accommodations").select("id, address, internal_notes, contact_phone").in("id", accIds)
      : Promise.resolve({ data: [] }),
    itemIds.length > 0
      ? supabase.from("booking_items").select("id, booking_id, bookings(id, status, source_channel, total_amount, payment_status, payment_method, incident_reason, customers(phone))").in("id", itemIds)
      : Promise.resolve({ data: [] }),
  ]);

  type AccInfo = { id: string; address: string | null; internal_notes: string | null; contact_phone: string | null };
  const accInfoMap = new Map((accs ?? []).map((a: AccInfo) => [a.id, a]));

  interface ItemWithBooking {
    id: string;
    booking_id: string | null;
    bookings: {
      id: string;
      status: string | null;
      source_channel: string | null;
      total_amount: number | null;
      payment_status: string | null;
      payment_method: string | null;
      incident_reason: string | null;
      customers: { phone: string | null } | null;
    } | null;
  }
  const itemMap = new Map(
    ((items ?? []) as unknown as ItemWithBooking[]).map((i) => [
      i.id,
      {
        booking_id: i.booking_id ?? i.bookings?.id ?? null,
        booking_status: i.bookings?.status ?? null,
        source_channel: i.bookings?.source_channel ?? null,
        payment_status: i.bookings?.payment_status ?? null,
        payment_method: i.bookings?.payment_method ?? null,
        incident_reason: i.bookings?.incident_reason ?? null,
        phone: i.bookings?.customers?.phone ?? null,
        total: i.bookings?.total_amount != null ? Number(i.bookings.total_amount) : null,
      },
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
      accommodation_address: s.accommodation_id ? accInfoMap.get(s.accommodation_id)?.address ?? null : null,
      accommodation_internal_notes: s.accommodation_id ? accInfoMap.get(s.accommodation_id)?.internal_notes ?? null : null,
      accommodation_phone: s.accommodation_id ? accInfoMap.get(s.accommodation_id)?.contact_phone ?? null : null,
      booking_item_id: s.booking_item_id,
      booking_code: s.booking_code,
      booking_id: itemInfo?.booking_id ?? null,
      booking_status: itemInfo?.booking_status ?? null,
      source_channel: itemInfo?.source_channel ?? null,
      payment_status: itemInfo?.payment_status ?? null,
      payment_method: itemInfo?.payment_method ?? null,
      incident_reason: itemInfo?.incident_reason ?? null,
      customer_name: s.customer_name,
      customer_phone: itemInfo?.phone ?? null,
      bags_count: s.bags_count,
      booking_total: itemInfo?.total ?? null,
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

  // Count bags from unique booking items to avoid doubling (each item has pickup + dropoff)
  const uniqueItemBags = new Map<string, number>();
  for (const s of stops) {
    if (s.booking_item_id && !uniqueItemBags.has(s.booking_item_id)) {
      uniqueItemBags.set(s.booking_item_id, s.bags_count);
    }
  }
  const realBags = [...uniqueItemBags.values()].reduce((sum, c) => sum + c, 0);

  const summary: RouteSummary = {
    totalStops: stops.length,
    pickupStops: stops.filter((s) => s.stop_type === "pickup").length,
    dropoffStops: stops.filter((s) => s.stop_type === "dropoff").length,
    totalBags: realBags,
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
