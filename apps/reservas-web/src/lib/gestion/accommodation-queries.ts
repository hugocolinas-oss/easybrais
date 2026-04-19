import { getServerSupabase } from "@/lib/supabase/server";

export interface AccommodationRow {
  id: string;
  external_code: string | null;
  name: string;
  display_name: string | null;
  stage_name: string | null;
  town: string | null;
  route_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  active: boolean;
  visible_in_reservations: boolean;
  internal_notes: string | null;
  reservation_notes: string | null;
  sort_order: number;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccommodationFilters {
  q?: string;
  active?: string;
  visible?: string;
  stage?: string;
  town?: string;
  page?: number;
}

const PAGE_SIZE = 25;

const SELECT_FIELDS =
  "id, external_code, name, display_name, stage_name, town, route_name, address, lat, lng, contact_phone, contact_email, active, visible_in_reservations, internal_notes, reservation_notes, sort_order, last_verified_at, created_at, updated_at";

export async function getAccommodations(filters: AccommodationFilters) {
  const supabase = await getServerSupabase();

  let query = supabase
    .from("accommodations")
    .select(SELECT_FIELDS, { count: "exact" });

  if (filters.q) {
    const q = `%${filters.q}%`;
    query = query.or(`name.ilike.${q},display_name.ilike.${q},town.ilike.${q},external_code.ilike.${q}`);
  }

  if (filters.active === "true") query = query.eq("active", true);
  else if (filters.active === "false") query = query.eq("active", false);

  if (filters.visible === "true") query = query.eq("visible_in_reservations", true);
  else if (filters.visible === "false") query = query.eq("visible_in_reservations", false);

  if (filters.stage) query = query.eq("stage_name", filters.stage);
  if (filters.town) query = query.ilike("town", `%${filters.town}%`);

  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  query = query
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[accommodation-queries] getAccommodations error:", error.message);
  }

  return {
    rows: (data ?? []) as unknown as AccommodationRow[],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export async function getAccommodationById(id: string): Promise<AccommodationRow | null> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("accommodations")
    .select(SELECT_FIELDS)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[accommodation-queries] getById error:", error.message);
    return null;
  }

  return data as unknown as AccommodationRow;
}

export async function getDistinctStages(): Promise<string[]> {
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("accommodations")
    .select("stage_name")
    .not("stage_name", "is", null)
    .order("stage_name", { ascending: true });

  const unique = new Set<string>();
  (data ?? []).forEach((r) => {
    if (r.stage_name) unique.add(r.stage_name);
  });

  return Array.from(unique);
}
