import Link from "next/link";
import { getDistinctStages } from "@/lib/accommodation-queries";
import { getServerSupabase } from "@/lib/supabase/server";
import { CreateAccommodationForm } from "@/components/alojamientos/create-form";

export const dynamic = "force-dynamic";

export default async function NuevoAlojamientoPage() {
  const [stages, towns] = await Promise.all([
    getDistinctStages(),
    getDistinctTowns(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/alojamientos"
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          ← Alojamientos
        </Link>
        <h2 className="text-lg font-bold text-gray-900">Nuevo alojamiento</h2>
      </div>

      <CreateAccommodationForm stages={stages} towns={towns} />
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
