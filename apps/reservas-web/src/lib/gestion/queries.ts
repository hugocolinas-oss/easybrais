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

interface RevenueRow {
  total_amount: number;
  booking_items: Array<{ bags_count: number }>;
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

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await getServerSupabase();
  const today = todayISO();

  const [pending, todayB, upcoming, failed, revenue] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("service_date", today),

    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("service_date", today)
      .in("status", ["pending", "confirmed"]),

    supabase
      .from("booking_items")
      .select("id", { count: "exact", head: true })
      .eq("operational_status", "failed"),

    supabase
      .from("bookings")
      .select("total_amount, booking_items(bags_count)")
      .eq("service_date", today)
      .in("status", ["pending", "confirmed", "in_progress", "completed"]),
  ]);

  let todayRevenue = 0;
  let todayBags = 0;

  const rows = (revenue.data ?? []) as unknown as RevenueRow[];
  for (const b of rows) {
    todayRevenue += Number(b.total_amount) || 0;
    if (Array.isArray(b.booking_items)) {
      for (const item of b.booking_items) {
        todayBags += item.bags_count || 0;
      }
    }
  }

  return {
    pendingBookings: pending.count ?? 0,
    todayBookings: todayB.count ?? 0,
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
