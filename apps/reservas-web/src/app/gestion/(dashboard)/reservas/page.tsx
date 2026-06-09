import Link from "next/link";
import { getBookings, type BookingFilters } from "@/lib/gestion/booking-queries";
import { BookingFilters as Filters } from "@/components/gestion/reservas/booking-filters";
import { StatusBadge } from "@/components/gestion/reservas/status-badge";
import { formatEUR, fmtDateShort } from "@easybrais/utils";
import { getPaymentStatusConfig } from "@/lib/gestion/payment-status";
import { formatPhoneForDisplay } from "@/lib/phone";
import { IncidentFlag } from "@/components/gestion/reservas/incident-flag";

export const dynamic = "force-dynamic";

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: BookingFilters = {
    status: params.status ?? undefined,
    date: params.date ?? undefined,
    dateFrom: params.dateFrom ?? undefined,
    dateTo: params.dateTo ?? undefined,
    paymentStatus: params.paymentStatus ?? undefined,
    q: params.q ?? undefined,
    page: params.page ? Number(params.page) : 1,
  };

  const { rows: bookings, total, page, totalPages } = await getBookings(filters);

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (filters.status) sp.set("status", filters.status);
    if (filters.dateFrom) sp.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) sp.set("dateTo", filters.dateTo);
    if (filters.date) sp.set("date", filters.date);
    if (filters.paymentStatus) sp.set("paymentStatus", filters.paymentStatus);
    if (filters.q) sp.set("q", filters.q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/gestion/reservas${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Reservas</h2>
          <p className="text-xs text-gray-500 sm:mt-1 sm:text-sm">{total} resultados</p>
        </div>
        <Link
          href="/gestion/reservas/nueva"
          className="flex items-center gap-1.5 rounded-lg bg-brand-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:px-4 sm:text-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Nueva reserva</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      <Filters />

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          No se encontraron reservas con estos filtros.
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-2 sm:hidden">
            {bookings.map((b) => {
              const pay = getPaymentStatusConfig(b.payment_status, b.payment_expires_at);
              const customerPhone = formatPhoneForDisplay(b.customer_phone);
              return (
                <Link
                  key={b.id}
                  href={`/gestion/reservas/${b.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-3 active:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-700">{b.booking_code}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-gray-900">{b.customer_name}</p>
                  {customerPhone && (
                    <p className="text-xs text-gray-400">{customerPhone}</p>
                  )}
                  {b.incident_reason && (
                    <div className="mt-2">
                      <IncidentFlag reason={b.incident_reason} compact />
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>{fmtDateShort(b.service_date)}</span>
                    <span>{b.bags_count} 🎒</span>
                    <span className="font-semibold text-gray-900">{formatEUR(b.total_amount)}</span>
                    <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pay.cls}`}>{pay.label}</span>
                  </div>
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
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Ruta</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-center">Mochilas</th>
                    <th className="px-4 py-3 text-right">Importe</th>
                    <th className="hidden px-4 py-3 md:table-cell">Pago</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => {
                    const pay = getPaymentStatusConfig(b.payment_status, b.payment_expires_at);
                    const customerPhone = formatPhoneForDisplay(b.customer_phone);
                    return (
                      <tr key={b.id} className="group hover:bg-gray-50/60">
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link href={`/gestion/reservas/${b.id}`} className="font-mono text-xs font-semibold text-brand-700 underline-offset-2 group-hover:underline">
                            {b.booking_code}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/gestion/reservas/${b.id}`} className="block">
                            <p className="font-medium text-gray-900">{b.customer_name}</p>
                            {customerPhone && <p className="text-xs text-gray-400">{customerPhone}</p>}
                            {b.incident_reason && (
                              <div className="mt-1">
                                <IncidentFlag reason={b.incident_reason} compact />
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <p className="max-w-[220px] truncate text-xs text-gray-600" title={`${b.pickup_name} → ${b.dropoff_name}`}>
                            {b.pickup_name} → {b.dropoff_name}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{fmtDateShort(b.service_date)}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{b.bags_count}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">{formatEUR(b.total_amount)}</td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${pay.cls}`}>{pay.label}</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
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
                Pág. {page}/{totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={pageHref(page - 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 active:bg-gray-100 sm:px-3 sm:py-1.5">
                    Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={pageHref(page + 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 active:bg-gray-100 sm:px-3 sm:py-1.5">
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
