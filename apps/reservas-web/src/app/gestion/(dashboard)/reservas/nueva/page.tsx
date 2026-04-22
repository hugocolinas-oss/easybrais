import { getServerSupabase } from "@/lib/supabase/server";
import { ManualBookingForm } from "@/components/gestion/reservas/manual-booking-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NuevaReservaPage() {
  const supabase = await getServerSupabase();

  const { data: rows } = await supabase
    .from("accommodations")
    .select("id, external_code, name, display_name, stage_name, town, address, reservation_notes, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  type RawRow = {
    id: string;
    external_code: string | null;
    name: string;
    display_name: string | null;
    stage_name: string | null;
    town: string | null;
    address: string | null;
    reservation_notes: string | null;
    sort_order: number;
  };

  const accommodations = ((rows ?? []) as unknown as RawRow[]).map((r) => ({
    id: r.id,
    external_code: r.external_code,
    name: r.name,
    display_name: r.display_name ?? r.name,
    stage_name: r.stage_name,
    town: r.town,
    address: r.address,
    reservation_notes: r.reservation_notes ?? null,
    sort_order: r.sort_order ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/gestion/reservas"
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
        >
          ← Reservas
        </Link>
        <h2 className="text-lg font-bold text-gray-900">Nueva reserva manual</h2>
      </div>
      <ManualBookingForm accommodations={accommodations} />
    </div>
  );
}
