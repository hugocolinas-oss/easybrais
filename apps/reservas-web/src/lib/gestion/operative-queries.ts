import { getServerSupabase } from "@/lib/supabase/server";

export interface OperativeItem {
  id: string;
  service_date: string;
  bags_count: number;
  overweight_bags_count: number;
  operational_status: string;
  pickup_name: string;
  dropoff_name: string;
  booking_id: string;
  booking_code: string;
  booking_status: string;
  source_channel: string;
  payment_status: string;
  payment_method: string | null;
  incident_reason: string | null;
  customer_name: string;
  customer_phone: string | null;
  notes_customer: string | null;
  notes_internal: string | null;
}

interface RawOperativeItem {
  id: string;
  service_date: string;
  bags_count: number;
  overweight_bags_count: number;
  operational_status: string;
  pickup: { name: string } | null;
  dropoff: { name: string } | null;
  bookings: {
    id: string;
    booking_code: string;
    status: string;
    source_channel: string;
    payment_status: string;
    payment_method: string | null;
    incident_reason: string | null;
    notes_customer: string | null;
    notes_internal: string | null;
    customers: { full_name: string; phone: string | null } | null;
  } | null;
}

export interface OperativeSummary {
  total: number;
  pending: number;
  picked_up: number;
  delivered: number;
  incident: number;
  total_bags: number;
}

export async function getOperativeData(date: string): Promise<{
  items: OperativeItem[];
  summary: OperativeSummary;
}> {
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("booking_items")
    .select(
      `id, service_date, bags_count, overweight_bags_count, operational_status,
       pickup:pickup_accommodation_id(name),
       dropoff:dropoff_accommodation_id(name),
       bookings!inner(id, booking_code, status, source_channel, payment_status, payment_method, incident_reason, notes_customer, notes_internal,
         customers(full_name, phone)
       )`,
    )
    .eq("service_date", date)
    .order("operational_status", { ascending: true });

  const rows = (data ?? []) as unknown as RawOperativeItem[];

  const items: OperativeItem[] = rows.map((r) => ({
    id: r.id,
    service_date: r.service_date,
    bags_count: r.bags_count,
    overweight_bags_count: r.overweight_bags_count,
    operational_status: r.operational_status,
    pickup_name: r.pickup?.name ?? "—",
    dropoff_name: r.dropoff?.name ?? "—",
    booking_id: r.bookings?.id ?? "",
    booking_code: r.bookings?.booking_code ?? "—",
    booking_status: r.bookings?.status ?? "—",
    source_channel: r.bookings?.source_channel ?? "web",
    payment_status: r.bookings?.payment_status ?? "pending",
    payment_method: r.bookings?.payment_method ?? null,
    incident_reason: r.bookings?.incident_reason ?? null,
    customer_name: r.bookings?.customers?.full_name ?? "—",
    customer_phone: r.bookings?.customers?.phone ?? null,
    notes_customer: r.bookings?.notes_customer ?? null,
    notes_internal: r.bookings?.notes_internal ?? null,
  }));

  const summary: OperativeSummary = {
    total: items.length,
    pending: items.filter((i) => i.operational_status === "pending").length,
    picked_up: items.filter((i) => i.operational_status === "picked_up").length,
    delivered: items.filter((i) => i.operational_status === "delivered").length,
    incident: items.filter((i) => i.operational_status === "incident").length,
    total_bags: items.reduce((s, i) => s + i.bags_count, 0),
  };

  return { items, summary };
}
