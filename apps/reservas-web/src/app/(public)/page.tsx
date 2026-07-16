import { getServerSupabase } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking-form";
import { HeroSection } from "@/components/hero-section";
import type { Accommodation } from "@/lib/types";

export default async function HomePage() {
  const supabase = await getServerSupabase();

  const { data: rows } = await supabase
    .from("accommodations")
    .select("id, external_code, name, display_name, stage_name, town, address, reservation_notes, sort_order, route_stage:route_stages!accommodations_route_stage_id_fkey(code, name, route_section, branch_sequence, price_to_redondela)")
    .eq("active", true)
    .eq("visible_in_reservations", true)
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
    route_stage: Accommodation["route_stage"];
  };
  const raw = (rows ?? []) as unknown as RawRow[];

  const accommodations: Accommodation[] = raw.map((r) => ({
    id: r.id,
    external_code: r.external_code,
    name: r.name,
    display_name: r.display_name ?? r.name,
    stage_name: r.stage_name,
    town: r.town,
    address: r.address,
    reservation_notes: r.reservation_notes ?? null,
    sort_order: r.sort_order ?? 0,
    route_stage: r.route_stage,
  }));

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="relative z-10">
        <HeroSection />
        <BookingForm allAccommodations={accommodations} />
      </div>
    </div>
  );
}
