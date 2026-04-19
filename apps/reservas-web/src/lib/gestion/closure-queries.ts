import { getServerSupabase } from "@/lib/supabase/server";

export interface CashClosureRow {
  id: string;
  closure_date: string;
  total_bookings: number;
  total_bags: number;
  gross_amount: number;
  discounts_amount: number;
  extras_amount: number;
  net_amount: number;
  pending_collection_amount: number;
  cancellations_count: number;
  generated_at: string;
}

export interface ClosureSummary {
  count: number;
  totalBookings: number;
  totalBags: number;
  totalGross: number;
  totalDiscounts: number;
  totalExtras: number;
  totalNet: number;
  totalPending: number;
  totalCancellations: number;
  avgNetPerDay: number;
}

export interface ClosureFilters {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}

export interface ClosureListResult {
  rows: CashClosureRow[];
  total: number;
  page: number;
  totalPages: number;
  summary: ClosureSummary;
}

const PAGE_SIZE = 30;

function castNumeric(r: CashClosureRow): CashClosureRow {
  return {
    ...r,
    gross_amount: Number(r.gross_amount) || 0,
    discounts_amount: Number(r.discounts_amount) || 0,
    extras_amount: Number(r.extras_amount) || 0,
    net_amount: Number(r.net_amount) || 0,
    pending_collection_amount: Number(r.pending_collection_amount) || 0,
  };
}

export async function getClosures(filters: ClosureFilters = {}): Promise<ClosureListResult> {
  const supabase = await getServerSupabase();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("daily_cash_closures")
    .select(
      "id, closure_date, total_bookings, total_bags, gross_amount, discounts_amount, extras_amount, net_amount, pending_collection_amount, cancellations_count, generated_at",
      { count: "exact" },
    )
    .order("closure_date", { ascending: false });

  if (filters.dateFrom) {
    query = query.gte("closure_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("closure_date", filters.dateTo);
  }

  query = query.range(from, to);

  const { data, count } = await query;
  const rawRows = (data ?? []) as unknown as CashClosureRow[];
  const rows = rawRows.map(castNumeric);
  const total = count ?? 0;

  const summary: ClosureSummary = {
    count: rows.length,
    totalBookings: rows.reduce((s, r) => s + r.total_bookings, 0),
    totalBags: rows.reduce((s, r) => s + r.total_bags, 0),
    totalGross: rows.reduce((s, r) => s + r.gross_amount, 0),
    totalDiscounts: rows.reduce((s, r) => s + r.discounts_amount, 0),
    totalExtras: rows.reduce((s, r) => s + r.extras_amount, 0),
    totalNet: rows.reduce((s, r) => s + r.net_amount, 0),
    totalPending: rows.reduce((s, r) => s + r.pending_collection_amount, 0),
    totalCancellations: rows.reduce((s, r) => s + r.cancellations_count, 0),
    avgNetPerDay: rows.length > 0 ? rows.reduce((s, r) => s + r.net_amount, 0) / rows.length : 0,
  };

  return {
    rows,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    summary,
  };
}

export async function getClosureForDate(date: string): Promise<CashClosureRow | null> {
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("daily_cash_closures")
    .select(
      "id, closure_date, total_bookings, total_bags, gross_amount, discounts_amount, extras_amount, net_amount, pending_collection_amount, cancellations_count, generated_at",
    )
    .eq("closure_date", date)
    .single();

  if (!data) return null;
  return castNumeric(data as unknown as CashClosureRow);
}
