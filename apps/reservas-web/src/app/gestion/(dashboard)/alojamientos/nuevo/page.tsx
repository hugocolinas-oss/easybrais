import Link from "next/link";
import { getDistinctStages } from "@/lib/gestion/accommodation-queries";
import { getServerSupabase } from "@/lib/supabase/server";
import { CreateAccommodationForm } from "@/components/gestion/alojamientos/create-form";

export const dynamic = "force-dynamic";

export default async function NuevoAlojamientoPage() {
  const [stages, towns, existingCodes] = await Promise.all([
    getDistinctStages(),
    getDistinctTowns(),
    getExistingCodes(),
  ]);

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

      <CreateAccommodationForm stages={stages} towns={towns} existingCodes={existingCodes} />
    </div>
  );
}

async function getDistinctTowns(): Promise<string[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("accommodations")
    .select("town")
    .not("town", "is", null)
    .order("town", { ascending: true });

  const unique = new Set<string>();
  (data ?? []).forEach((r) => {
    if (r.town) unique.add(r.town.trim());
  });
  return Array.from(unique);
}

async function getExistingCodes(): Promise<string[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("accommodations")
    .select("external_code")
    .not("external_code", "is", null);

  return (data ?? []).map((r) => r.external_code).filter(Boolean) as string[];
}
