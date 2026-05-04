import Image from "next/image";
import { getServerSupabase } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking-form";
import { HeroSection } from "@/components/hero-section";
import type { Accommodation } from "@/lib/types";
import { BRAND_LOGO_SRC } from "@/lib/brand";

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
    <div className="relative mx-auto max-w-4xl">
      <div
        className="pointer-events-none absolute -right-6 top-24 z-0 hidden select-none opacity-[0.14] sm:block lg:-right-10 lg:top-32"
        aria-hidden
      >
        <div className="relative h-40 w-40 lg:h-48 lg:w-48">
          <Image src={BRAND_LOGO_SRC} alt="" fill className="object-contain" sizes="(max-width: 1024px) 160px, 192px" />
        </div>
      </div>
      <div className="relative z-10">
        <HeroSection />
        <BookingForm allAccommodations={accommodations} />
      </div>
    </div>
  );
}
