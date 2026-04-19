import Link from "next/link";
import { getAccommodations, getDistinctStages, type AccommodationFilters } from "@/lib/gestion/accommodation-queries";
import { AccommodationFilters as Filters } from "@/components/gestion/alojamientos/accommodation-filters";
import { ToggleActiveButton, ToggleVisibleButton } from "@/components/gestion/alojamientos/toggle-buttons";

export const dynamic = "force-dynamic";

export default async function AlojamientosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: AccommodationFilters = {
    q: params.q ?? undefined,
    active: params.active ?? undefined,
    visible: params.visible ?? undefined,
    stage: params.stage ?? undefined,
    town: params.town ?? undefined,
    page: params.page ? Number(params.page) : 1,
  };

  const [{ rows, total, page, totalPages }, stages] = await Promise.all([
    getAccommodations(filters),
    getDistinctStages(),
  ]);

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.active) sp.set("active", filters.active);
    if (filters.visible) sp.set("visible", filters.visible);
    if (filters.stage) sp.set("stage", filters.stage);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/alojamientos${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Alojamientos</h2>
          <p className="text-xs text-gray-500 sm:mt-1 sm:text-sm">{total} registros</p>
        </div>
        <Link
          href="/gestion/alojamientos/nuevo"
          className="flex items-center gap-1.5 rounded-lg bg-brand-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:px-4 sm:text-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Nuevo alojamiento</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      <Filters stages={stages} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          No se encontraron alojamientos con estos filtros.
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-2 sm:hidden">
            {rows.map((a) => (
              <Link
                key={a.id}
                href={`/alojamientos/${a.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-3 active:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {a.display_name ?? a.name}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    <ToggleActiveButton id={a.id} active={a.active} />
                    <ToggleVisibleButton id={a.id} visible={a.visible_in_reservations} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                  {a.external_code && <span className="font-mono">{a.external_code}</span>}
                  {a.stage_name && <span>· {a.stage_name}</span>}
                  {a.town && <span>· {a.town}</span>}
                </div>
                {a.internal_notes && (
                  <p className="mt-1 truncate text-[11px] text-amber-600">{a.internal_notes}</p>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Etapa</th>
                    <th className="px-4 py-3">Localidad</th>
                    <th className="px-4 py-3 text-center">Orden</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Visible</th>
                    <th className="px-4 py-3">Verificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((a) => (
                    <tr key={a.id} className="group hover:bg-gray-50/60">
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/alojamientos/${a.id}`}
                          className="font-mono text-xs font-semibold text-brand-700 underline-offset-2 group-hover:underline"
                        >
                          {a.external_code ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/alojamientos/${a.id}`} className="block">
                          <p className="font-medium text-gray-900">{a.display_name ?? a.name}</p>
                          {a.display_name && a.display_name !== a.name && (
                            <p className="text-[11px] text-gray-400">orig: {a.name}</p>
                          )}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{a.stage_name ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{a.town ?? "—"}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{a.sort_order}</td>
                      <td className="px-4 py-3 text-center">
                        <ToggleActiveButton id={a.id} active={a.active} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ToggleVisibleButton id={a.id} visible={a.visible_in_reservations} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                        {a.last_verified_at
                          ? new Date(a.last_verified_at).toLocaleDateString("es-ES")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">
                Pág. {page}/{totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={pageHref(page - 1)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 active:bg-gray-100 sm:px-3 sm:py-1.5"
                  >
                    Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={pageHref(page + 1)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 active:bg-gray-100 sm:px-3 sm:py-1.5"
                  >
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
