import { getServerSupabase } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking-form";
import { HeroSection } from "@/components/hero-section";
import type { Accommodation } from "@/lib/types";

export default async function HomePage() {
  const supabase = await getServerSupabase();

  const { data: rows } = await supabase
    .from("accommodations")
    .select("id, external_code, name, display_name, stage_name, town, address, reservation_notes, sort_order")
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
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <HeroSection />
      <BookingForm allAccommodations={accommodations} />
    </div>
  );
}
