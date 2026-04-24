import { getServerSupabase } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookingListRow {
  id: string;
  booking_code: string;
  service_date: string;
  status: string;
  total_amount: number;
  payment_status: string;
  source_channel: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  bags_count: number;
  pickup_name: string;
  dropoff_name: string;
  created_at: string;
}

export interface BookingDetail {
  id: string;
  booking_code: string;
  service_date: string;
  status: string;
  source_channel: string;
  language: string;
  notes_customer: string | null;
  notes_internal: string | null;
  subtotal_amount: number;
  discount_amount: number;
  extra_weight_amount: number;
  total_amount: number;
  payment_status: string;
  email_status: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  payment_method: string | null;
  payment_expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    language: string;
  };
  items: BookingItemRow[];
  events: BookingEventRow[];
}

export interface BookingItemRow {
  id: string;
  service_date: string;
  pickup_name: string;
  pickup_town: string;
  dropoff_name: string;
  dropoff_town: string;
  bags_count: number;
  overweight_bags_count: number;
  unit_price: number;
  line_total: number;
  operational_status: string;
}

export interface BookingEventRow {
  id: string;
  event_type: string;
  actor_type: string;
  actor_id: string | null;
  payload_json: Record<string, unknown> | null;
  created_at: string;
}

export interface BookingFilters {
  status?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
  q?: string;
  page?: number;
}

export const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Internal raw shapes
// ---------------------------------------------------------------------------

interface RawBookingList {
  id: string;
  booking_code: string;
  service_date: string;
  status: string;
  total_amount: number;
  payment_status: string;
  source_channel: string;
  created_at: string;
  customers: { full_name: string; email: string | null; phone: string | null } | null;
  booking_items: Array<{
    bags_count: number;
    pickup: { name: string } | null;
    dropoff: { name: string } | null;
  }>;
}

interface RawBookingDetail {
  id: string;
  booking_code: string;
  service_date: string;
  status: string;
  source_channel: string;
  language: string;
  notes_customer: string | null;
  notes_internal: string | null;
  subtotal_amount: number;
  discount_amount: number;
  extra_weight_amount: number;
  total_amount: number;
  payment_status: string;
  email_status: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  payment_method: string | null;
  payment_expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  customers: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    language: string;
  } | null;
}

interface RawBookingItem {
  id: string;
  service_date: string;
  bags_count: number;
  overweight_bags_count: number;
  unit_price: number;
  line_total: number;
  operational_status: string;
  pickup: { name: string; town: string | null } | null;
  dropoff: { name: string; town: string | null } | null;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface BookingListResult {
  rows: BookingListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getBookings(filters: BookingFilters): Promise<BookingListResult> {
  const supabase = await getServerSupabase();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("bookings")
    .select(
      "id, booking_code, service_date, status, total_amount, payment_status, source_channel, created_at, customers(full_name, email, phone), booking_items(bags_count, pickup:pickup_accommodation_id(name), dropoff:dropoff_accommodation_id(name))",
      { count: "exact" },
    )
    .order("service_date", { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq("status", filters.status as never);
  }
  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus as never);
  }
  if (filters.date) {
    query = query.eq("service_date", filters.date);
  }
  if (filters.dateFrom) {
    query = query.gte("service_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("service_date", filters.dateTo);
  }
  if (filters.q) {
    const term = filters.q.trim().replace(/[,.*()"\\\[\]]/g, "");
    if (term.length > 0) {
      const { data: matchingCustomers } = await supabase
        .from("customers")
        .select("id")
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);

      const customerIds = (matchingCustomers ?? []).map((c: { id: string }) => c.id);

      if (customerIds.length > 0) {
        query = query.or(
          `booking_code.ilike.%${term}%,customer_id.in.(${customerIds.join(",")})`,
        );
      } else {
        query = query.ilike("booking_code", `%${term}%`);
      }
    }
  }

  const { data, count } = await query;
  const rows = (data ?? []) as unknown as RawBookingList[];
  const total = count ?? 0;

  return {
    rows: rows.map((r) => {
      const items = Array.isArray(r.booking_items) ? r.booking_items : [];
      const firstItem = items[0];
      const lastItem = items.length > 1 ? items[items.length - 1] : firstItem;
      return {
        id: r.id,
        booking_code: r.booking_code,
        service_date: r.service_date,
        status: r.status,
        total_amount: Number(r.total_amount) || 0,
        payment_status: r.payment_status ?? "pending",
        source_channel: r.source_channel ?? "web",
        customer_name: r.customers?.full_name ?? "—",
        customer_email: r.customers?.email ?? "",
        customer_phone: r.customers?.phone ?? "",
        bags_count: items.reduce((s, i) => s + (i.bags_count || 0), 0),
        pickup_name: firstItem?.pickup?.name ?? "—",
        dropoff_name: lastItem?.dropoff?.name ?? "—",
        created_at: r.created_at,
      };
    }),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getBookingDetail(id: string): Promise<BookingDetail | null> {
  const supabase = await getServerSupabase();

  const { data: raw } = await supabase
    .from("bookings")
    .select("id, booking_code, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status, stripe_session_id, stripe_payment_intent, payment_method, payment_expires_at, paid_at, created_at, updated_at, customers(id, full_name, email, phone, language)")
    .eq("id", id)
    .single();

  if (!raw) return null;
  const booking = raw as unknown as RawBookingDetail;

  const [{ data: rawItems }, { data: rawEvents }] = await Promise.all([
    supabase
      .from("booking_items")
      .select("id, service_date, bags_count, overweight_bags_count, unit_price, line_total, operational_status, pickup:pickup_accommodation_id(name, town), dropoff:dropoff_accommodation_id(name, town)")
      .eq("booking_id", id)
      .order("service_date", { ascending: true }),
    supabase
      .from("booking_events")
      .select("id, event_type, actor_type, actor_id, payload_json, created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const items: BookingItemRow[] = ((rawItems ?? []) as unknown as RawBookingItem[]).map((i) => ({
    id: i.id,
    service_date: i.service_date,
    pickup_name: i.pickup?.name ?? "—",
    pickup_town: i.pickup?.town ?? "",
    dropoff_name: i.dropoff?.name ?? "—",
    dropoff_town: i.dropoff?.town ?? "",
    bags_count: i.bags_count,
    overweight_bags_count: i.overweight_bags_count,
    unit_price: Number(i.unit_price) || 0,
    line_total: Number(i.line_total) || 0,
    operational_status: i.operational_status,
  }));

  const events = (rawEvents ?? []) as unknown as BookingEventRow[];

  return {
    id: booking.id,
    booking_code: booking.booking_code,
    service_date: booking.service_date,
    status: booking.status,
    source_channel: booking.source_channel,
    language: booking.language,
    notes_customer: booking.notes_customer,
    notes_internal: booking.notes_internal,
    subtotal_amount: Number(booking.subtotal_amount) || 0,
    discount_amount: Number(booking.discount_amount) || 0,
    extra_weight_amount: Number(booking.extra_weight_amount) || 0,
    total_amount: Number(booking.total_amount) || 0,
    payment_status: booking.payment_status,
    email_status: booking.email_status,
    stripe_session_id: (booking as RawBookingDetail).stripe_session_id ?? null,
    stripe_payment_intent: (booking as RawBookingDetail).stripe_payment_intent ?? null,
    payment_method: (booking as RawBookingDetail).payment_method ?? null,
    payment_expires_at: (booking as RawBookingDetail).payment_expires_at ?? null,
    paid_at: (booking as RawBookingDetail).paid_at ?? null,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    customer: booking.customers ?? { id: "", full_name: "—", email: null, phone: null, language: "es" },
    items,
    events,
  };
}
