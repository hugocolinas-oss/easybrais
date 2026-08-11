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
  customer_name: string;
  customer_phone: string | null;
  notes_customer: string | null;
  notes_internal: string | null;
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

  const { data, error } = await supabase.rpc("get_operational_items", {
    target_date: date,
  });
  if (error) console.error("[operative-queries] protected query failed:", error.message);
  const rows = data ?? [];

  const items: OperativeItem[] = rows.map((r) => ({
    id: r.id,
    service_date: r.service_date,
    bags_count: r.bags_count,
    overweight_bags_count: r.overweight_bags_count,
    operational_status: r.operational_status,
    pickup_name: r.pickup_name ?? "—",
    dropoff_name: r.dropoff_name ?? "—",
    booking_id: r.booking_id,
    booking_code: r.booking_code,
    booking_status: r.booking_status,
    customer_name: r.customer_name,
    customer_phone: r.customer_phone,
    notes_customer: r.notes_customer,
    notes_internal: r.notes_internal,
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
