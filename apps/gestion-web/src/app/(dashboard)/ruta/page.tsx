import { Suspense } from "react";
import { getRouteForDate } from "@/lib/route-queries";
import { RouteDateSelector } from "@/components/ruta/route-date-selector";
import { RouteHeader } from "@/components/ruta/route-header";
import { RouteBoard } from "@/components/ruta/route-board";
import { GenerateRouteButton } from "@/components/ruta/generate-route-button";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function RutaPage({ searchParams }: Props) {
  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0] ?? "";
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;

  const route = await getRouteForDate(date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ruta del día</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Hoja de ruta con recogidas y entregas ordenadas
          </p>
        </div>
        <Suspense fallback={null}>
          <RouteDateSelector currentDate={date} />
        </Suspense>
      </div>

      {route ? (
        <>
          <RouteHeader route={route} />
          <RouteBoard route={route} />
        </>
      ) : (
        <GenerateRouteButton date={date} />
      )}
    </div>
  );
}
