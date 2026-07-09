import Link from "next/link";
import { getAccommodations, getStagesInfo, type AccommodationFilters } from "@/lib/gestion/accommodation-queries";
import { AccommodationFilters as Filters } from "@/components/gestion/alojamientos/accommodation-filters";
import { StageManager } from "@/components/gestion/alojamientos/stage-manager";
import { ToggleActiveButton, ToggleVisibleButton } from "@/components/gestion/alojamientos/toggle-buttons";
import { requireAuth } from "@/lib/gestion/auth";
import { ensureAccommodationsAccess } from "@/lib/gestion/permissions";

export const dynamic = "force-dynamic";

export default async function AlojamientosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireAuth();
  ensureAccommodationsAccess(profile.role);

  const params = await searchParams;
  const filters: AccommodationFilters = {
    q: params.q ?? undefined,
    active: params.active ?? undefined,
    visible: params.visible ?? undefined,
    stage: params.stage ?? undefined,
    town: params.town ?? undefined,
    page: params.page ? Number(params.page) : 1,
  };

  const [{ rows, total, page, totalPages }, stagesInfo] = await Promise.all([
    getAccommodations(filters),
    getStagesInfo(),
  ]);

  const stageNames = stagesInfo.map((s) => s.name);

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.active) sp.set("active", filters.active);
    if (filters.visible) sp.set("visible", filters.visible);
    if (filters.stage) sp.set("stage", filters.stage);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/gestion/alojamientos${qs ? `?${qs}` : ""}`;
  }

  function stageNumber(code: string | null): number | null {
    if (!code) return null;
    const n = parseInt(code.split(".")[0] ?? "", 10);
    return Number.isNaN(n) ? null : n;
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

      <StageManager stages={stagesInfo} />

      <Filters stages={stageNames} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          No se encontraron alojamientos con estos filtros.
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-2 sm:hidden">
            {rows.map((a) => {
              const sn = stageNumber(a.external_code);
              return (
                <Link
                  key={a.id}
                  href={`/gestion/alojamientos/${a.id}`}
                  className={`block rounded-lg border bg-white p-3 active:bg-gray-50 ${
                    !a.active ? "border-red-100 opacity-60" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {a.external_code && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-bold text-gray-700">
                          {a.external_code}
                        </span>
                      )}
                      <p className="truncate text-sm font-medium text-gray-900">
                        {a.display_name ?? a.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <ToggleActiveButton id={a.id} active={a.active} />
                      <ToggleVisibleButton id={a.id} visible={a.visible_in_reservations} />
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                    {sn != null && (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                        E{sn}
                      </span>
                    )}
                    {a.stage_name && <span>{a.stage_name}</span>}
                    {a.town && <span>· {a.town}</span>}
                  </div>
                  {a.internal_notes && (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                      <p className="text-[11px] font-semibold uppercase text-amber-700">Notas internas</p>
                      <p className="mt-0.5 whitespace-pre-line text-xs text-amber-900">{a.internal_notes}</p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 w-20">Cod.</th>
                    <th className="px-4 py-3 w-10 text-center">Etapa</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Localidad</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Visible</th>
                    <th className="px-4 py-3 text-center">Verificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((a) => {
                    const sn = stageNumber(a.external_code);
                    return (
                      <tr
                        key={a.id}
                        className={`group transition-colors hover:bg-gray-50/60 ${!a.active ? "bg-red-50/30" : ""}`}
                      >
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <Link
                            href={`/gestion/alojamientos/${a.id}`}
                            className="font-mono text-xs font-bold text-brand-700 underline-offset-2 group-hover:underline"
                          >
                            {a.external_code ?? "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {sn != null ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-700">
                              {sn}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <Link href={`/gestion/alojamientos/${a.id}`} className="block">
                            <p className={`font-medium ${!a.active ? "text-gray-400 line-through" : "text-gray-900"}`}>
                              {a.display_name ?? a.name}
                            </p>
                            {a.stage_name && (
                              <p className="text-[11px] text-gray-400">{a.stage_name}</p>
                            )}
                          </Link>
                          {a.internal_notes && (
                            <div className="mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-1">
                              <p className="whitespace-pre-line text-[11px] text-amber-900">{a.internal_notes}</p>
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{a.town ?? "—"}</td>
                        <td className="px-4 py-2.5 text-center">
                          <ToggleActiveButton id={a.id} active={a.active} />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <ToggleVisibleButton id={a.id} visible={a.visible_in_reservations} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center text-xs text-gray-400">
                          {a.last_verified_at
                            ? new Date(a.last_verified_at).toLocaleDateString("es-ES")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">
                Pág. {page}/{totalPages} &middot; {total} registros
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
