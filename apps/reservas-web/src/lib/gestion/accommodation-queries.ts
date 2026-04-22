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

export interface StageInfo {
  name: string;
  stageNumber: number;
  total: number;
  active: number;
  visible: number;
}

const PAGE_SIZE = 50;

const SELECT_FIELDS =
  "id, external_code, name, display_name, stage_name, town, route_name, address, lat, lng, contact_phone, contact_email, active, visible_in_reservations, internal_notes, reservation_notes, sort_order, last_verified_at, created_at, updated_at";

function parseCode(code: string | null): [number, number] {
  if (!code) return [9999, 9999];
  const parts = code.split(".");
  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1] ?? "0", 10);
  return [Number.isNaN(a) ? 9999 : a, Number.isNaN(b) ? 9999 : b];
}

function compareByCode(a: AccommodationRow, b: AccommodationRow): number {
  const [a1, a2] = parseCode(a.external_code);
  const [b1, b2] = parseCode(b.external_code);
  if (a1 !== b1) return a1 - b1;
  return a2 - b2;
}

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

  const { data: allData, count, error } = await query;

  if (error) {
    console.error("[accommodation-queries] getAccommodations error:", error.message);
  }

  const sorted = ((allData ?? []) as unknown as AccommodationRow[]).sort(compareByCode);

  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const rows = sorted.slice(from, from + PAGE_SIZE);

  return {
    rows,
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

export async function getStagesInfo(): Promise<StageInfo[]> {
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("accommodations")
    .select("stage_name, external_code, active, visible_in_reservations")
    .not("stage_name", "is", null);

  const map = new Map<string, StageInfo>();

  for (const row of (data ?? []) as { stage_name: string; external_code: string | null; active: boolean; visible_in_reservations: boolean }[]) {
    const name = row.stage_name;
    if (!name) continue;
    let info = map.get(name);
    if (!info) {
      const [num] = parseCode(row.external_code);
      info = { name, stageNumber: num, total: 0, active: 0, visible: 0 };
      map.set(name, info);
    }
    info.total++;
    if (row.active) info.active++;
    if (row.visible_in_reservations) info.visible++;
  }

  return Array.from(map.values()).sort((a, b) => a.stageNumber - b.stageNumber);
}

export async function getDistinctStages(): Promise<string[]> {
  const info = await getStagesInfo();
  return info.map((s) => s.name);
}
