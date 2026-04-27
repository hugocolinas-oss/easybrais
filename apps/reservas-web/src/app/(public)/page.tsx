import { getServerSupabase } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking-form";
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
      {/* Hero */}
      <div className="mb-8 text-center sm:mb-12">
        <h2 className="text-balance text-2xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">
          Reserva tu transporte de equipaje
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-brand-800/60 sm:mt-4 sm:text-base">
          Llevamos tus mochilas de etapa en etapa para que solo te preocupes de disfrutar el Camino.
        </p>

        {/* Trust indicators */}
        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:mt-8">
          <TrustBadge icon="shield" text="Pago seguro" />
          <TrustBadge icon="clock" text="Entrega antes de 15:30" />
          <TrustBadge icon="check" text="Confirmación por email" />
        </div>
      </div>

      <BookingForm allAccommodations={accommodations} />
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: "shield" | "clock" | "check"; text: string }) {
  const icons = {
    shield: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    clock: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    check: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-brand-800/50">
      <span className="text-sage-500">{icons[icon]}</span>
      {text}
    </div>
  );
}
