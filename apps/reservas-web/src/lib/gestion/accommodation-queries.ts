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
  internal_cost: { extra_cost: number } | null;
  sort_order: number;
  route_stage_id: string | null;
  route_stage: {
    code: number;
    route_section: "coastal" | "central" | "shared";
    branch_sequence: number;
  } | null;
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
  routeOrder: number;
}

const PAGE_SIZE = 50;

const SELECT_FIELDS =
  "id, external_code, name, display_name, stage_name, town, route_name, address, lat, lng, contact_phone, contact_email, active, visible_in_reservations, internal_notes, reservation_notes, sort_order, route_stage_id, route_stage:route_stages!accommodations_route_stage_id_fkey(code, route_section, branch_sequence), internal_cost:accommodation_internal_costs(extra_cost), created_at, updated_at";

function parseCode(code: string | null): [number, number] {
  if (!code) return [9999, 9999];
  const parts = code.split(".");
  const a = parseInt(parts[0] ?? "", 10);
  const b = parseInt(parts[1] ?? "0", 10);
  return [Number.isNaN(a) ? 9999 : a, Number.isNaN(b) ? 9999 : b];
}

function compareByCode(a: AccommodationRow, b: AccommodationRow): number {
  const sectionOrder = { coastal: 0, central: 1, shared: 2 } as const;
  if (a.route_stage && b.route_stage) {
    const aSection = sectionOrder[a.route_stage.route_section];
    const bSection = sectionOrder[b.route_stage.route_section];
    if (aSection !== bSection) return aSection - bSection;
    if (a.route_stage.branch_sequence !== b.route_stage.branch_sequence) {
      return a.route_stage.branch_sequence - b.route_stage.branch_sequence;
    }
  }
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
    .select("stage_name, external_code, active, visible_in_reservations, route_stage:route_stages!accommodations_route_stage_id_fkey(route_section, branch_sequence)")
    .not("stage_name", "is", null);

  const map = new Map<string, StageInfo>();

  type StageRow = {
    stage_name: string;
    external_code: string | null;
    active: boolean;
    visible_in_reservations: boolean;
    route_stage: { route_section: "coastal" | "central" | "shared"; branch_sequence: number } | null;
  };
  const sectionOrder = { coastal: 0, central: 1, shared: 2 } as const;
  for (const row of (data ?? []) as unknown as StageRow[]) {
    const name = row.stage_name;
    if (!name) continue;
    let info = map.get(name);
    const [num] = parseCode(row.external_code);
    if (!info) {
      const routeOrder = row.route_stage
        ? sectionOrder[row.route_stage.route_section] * 100 + row.route_stage.branch_sequence
        : 9999;
      info = { name, stageNumber: num, total: 0, active: 0, visible: 0, routeOrder };
      map.set(name, info);
    }
    if (num < info.stageNumber) info.stageNumber = num;
    info.total++;
    if (row.active) info.active++;
    if (row.visible_in_reservations) info.visible++;
  }

  return Array.from(map.values()).sort((a, b) => a.routeOrder - b.routeOrder || a.stageNumber - b.stageNumber);
}

export async function getDistinctStages(): Promise<string[]> {
  const info = await getStagesInfo();
  return info.map((s) => s.name);
}
