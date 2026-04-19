"use client";

import type { RouteStop } from "@/lib/gestion/route-queries";

interface Props {
  stops: RouteStop[];
}

function stopAddress(s: RouteStop): string {
  if (s.accommodation_address) return s.accommodation_address;
  if (s.accommodation_name && s.accommodation_town)
    return `${s.accommodation_name}, ${s.accommodation_town}`;
  return s.accommodation_name || "";
}

function buildGoogleMapsUrl(stops: RouteStop[]): string | null {
  const addresses = stops
    .filter((s) => !s.completed)
    .map(stopAddress)
    .filter(Boolean);

  if (addresses.length === 0) return null;

  // Path-based format: /maps/dir/addr1/addr2/addr3
  // More reliable than query-param format with waypoints
  const segments = addresses.map((a) => encodeURIComponent(a));
  return `https://www.google.com/maps/dir/${segments.join("/")}`;
}

export function GoogleMapsButton({ stops }: Props) {
  const pendingStops = stops.filter((s) => !s.completed);
  const url = buildGoogleMapsUrl(stops);

  if (!url || pendingStops.length === 0) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400 opacity-50"
      >
        <MapIcon />
        Todas completadas
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
    >
      <MapIcon />
      Abrir ruta en Google Maps
      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
        {pendingStops.length} paradas
      </span>
    </a>
  );
}

function MapIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}
