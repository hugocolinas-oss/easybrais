import Link from "next/link";
import { getStagesInfo } from "@/lib/gestion/accommodation-queries";
import { getServerSupabase } from "@/lib/supabase/server";
import { CreateAccommodationForm } from "@/components/gestion/alojamientos/create-form";
import { requireAuth } from "@/lib/gestion/auth";
import { ensureAccommodationsAccess } from "@/lib/gestion/permissions";

export const dynamic = "force-dynamic";

export default async function NuevoAlojamientoPage() {
  const { profile } = await requireAuth();
  ensureAccommodationsAccess(profile.role);

  const [stagesInfo, towns, existingCodes] = await Promise.all([
    getStagesInfo(),
    getDistinctTowns(),
    getExistingCodes(),
  ]);

  const stages = stagesInfo.map((s) => s.name);
  const stageNumberMap: Record<string, number> = {};
  for (const s of stagesInfo) {
    stageNumberMap[s.name] = s.stageNumber;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/gestion/alojamientos"
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          ← Alojamientos
        </Link>
        <h2 className="text-lg font-bold text-gray-900">Nuevo alojamiento</h2>
      </div>

      <CreateAccommodationForm stages={stages} towns={towns} existingCodes={existingCodes} stageNumberMap={stageNumberMap} />
    </div>
  );
}

function normalizeTown(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    .replace(/\b(de|del|da|do|dos|das|la|las|el|los|a|o|e)\b/gi, (m) => m.toLowerCase())
    .replace(/^./, (c) => c.toUpperCase());
}

async function getDistinctTowns(): Promise<string[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("accommodations")
    .select("town")
    .not("town", "is", null)
    .order("town", { ascending: true });

  const seen = new Map<string, string>();
  (data ?? []).forEach((r) => {
    if (!r.town) return;
    const normalized = normalizeTown(r.town);
    const key = normalized.toLowerCase();
    if (!seen.has(key)) seen.set(key, normalized);
  });
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
}

async function getExistingCodes(): Promise<string[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("accommodations")
    .select("external_code")
    .not("external_code", "is", null);

  return (data ?? []).map((r) => r.external_code).filter(Boolean) as string[];
}
