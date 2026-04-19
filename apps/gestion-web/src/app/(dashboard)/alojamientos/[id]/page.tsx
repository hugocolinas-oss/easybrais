import { notFound } from "next/navigation";
import { getAccommodationById } from "@/lib/accommodation-queries";
import { EditAccommodationForm } from "@/components/alojamientos/edit-form";
import { MarkVerifiedButton } from "@/components/alojamientos/toggle-buttons";

export const dynamic = "force-dynamic";

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accommodation = await getAccommodationById(id);

  if (!accommodation) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            {accommodation.display_name ?? accommodation.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {accommodation.external_code && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">{accommodation.external_code}</span>
            )}
            {accommodation.stage_name && <span>· {accommodation.stage_name}</span>}
            {accommodation.town && <span>· {accommodation.town}</span>}
            {accommodation.route_name && <span>· {accommodation.route_name}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MarkVerifiedButton id={accommodation.id} />
          {accommodation.last_verified_at && (
            <span className="text-xs text-gray-400">
              Verificado: {new Date(accommodation.last_verified_at).toLocaleDateString("es-ES")}
            </span>
          )}
        </div>
      </div>

      {/* Coordinates info */}
      {(accommodation.lat || accommodation.lng) && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          Coordenadas: {accommodation.lat}, {accommodation.lng}
          {accommodation.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(accommodation.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-brand-600 hover:underline"
            >
              Ver en Google Maps →
            </a>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <EditAccommodationForm accommodation={accommodation} />
      </div>
    </div>
  );
}
