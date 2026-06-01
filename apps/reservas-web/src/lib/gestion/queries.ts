import { getServerSupabase } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  pendingBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  failedItems: number;
  todayRevenue: number;
  todayBags: number;
}

export interface RecentBooking {
  id: string;
  booking_code: string;
  service_date: string;
  status: string;
  total_amount: number;
  customer_name: string;
  bags_count: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Internal row shapes for Supabase casts
// ---------------------------------------------------------------------------

interface TodayItemRow {
  booking_id: string;
  bags_count: number;
  overweight_bags_count: number;
  line_total: number;
  bookings: { status: string; payment_status: string };
}

interface BookingRow {
  id: string;
  booking_code: string;
  service_date: string;
  status: string;
  total_amount: number;
  created_at: string;
  customers: { full_name: string } | null;
  booking_items: Array<{ bags_count: number }>;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const OVERWEIGHT_FEE = 5;

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await getServerSupabase();
  const today = todayISO();

  const [pending, upcoming, failed, itemsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(cancelled)")
      .in("payment_status", ["pending", "partial"]),

    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("service_date", today)
      .in("status", [
        "pending",
        "pending_payment",
        "confirmed",
        "in_pickup",
        "in_transit",
        "in_progress",
        "delivered",
        "completed",
      ]),

    supabase
      .from("booking_items")
      .select("id", { count: "exact", head: true })
      .eq("operational_status", "failed"),

    supabase
      .from("booking_items")
      .select("booking_id, bags_count, overweight_bags_count, line_total, bookings!inner(status, payment_status)")
      .eq("service_date", today),
  ]);

  if (itemsResult.error) {
    console.error("[getDashboardStats] booking_items fetch failed:", itemsResult.error.message);
  }

  const rawItems = (itemsResult.data ?? []) as unknown as TodayItemRow[];
  const activeItems = rawItems.filter((i) => i.bookings.status !== "cancelled");
  const todayBookingIds = new Set(activeItems.map((i) => i.booking_id));
  const todayBookings = todayBookingIds.size;
  const todayBags = activeItems.reduce((s, i) => s + (i.bags_count || 0), 0);
  const todayRevenue = activeItems.reduce(
    (s, i) =>
      s + (Number(i.line_total) || 0) + (i.overweight_bags_count || 0) * OVERWEIGHT_FEE,
    0,
  );

  return {
    pendingBookings: pending.count ?? 0,
    todayBookings,
    upcomingBookings: upcoming.count ?? 0,
    failedItems: failed.count ?? 0,
    todayRevenue,
    todayBags,
  };
}

export async function getRecentBookings(): Promise<RecentBooking[]> {
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, service_date, status, total_amount, created_at, customers(full_name), booking_items(bags_count)",
    )
    .order("created_at", { ascending: false })
    .limit(8);

  const rows = (data ?? []) as unknown as BookingRow[];

  return rows.map((row) => {
    const bags = Array.isArray(row.booking_items)
      ? row.booking_items.reduce((s, i) => s + (i.bags_count || 0), 0)
      : 0;

    return {
      id: row.id,
      booking_code: row.booking_code,
      service_date: row.service_date,
      status: row.status,
      total_amount: Number(row.total_amount) || 0,
      customer_name: row.customers?.full_name ?? "—",
      bags_count: bags,
      created_at: row.created_at,
    };
  });
}
