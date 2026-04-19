import Link from "next/link";
import type { RecentBooking } from "@/lib/gestion/queries";
import { formatEUR, fmtDateShort } from "@easybrais/utils";
import { getStatusConfig } from "@/lib/gestion/booking-status";

interface Props {
  bookings: RecentBooking[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function RecentBookings({ bookings }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
        No hay reservas registradas aún.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-2 sm:hidden">
        {bookings.map((b) => {
          const cfg = getStatusConfig(b.status);
          return (
            <Link
              key={b.id}
              href={`/gestion/reservas/${b.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-3 active:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-700">
                  {b.booking_code}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                  {cfg.shortLabel}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-gray-900">{b.customer_name}</p>
              <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
                <span>{fmtDateShort(b.service_date)}</span>
                <span>{b.bags_count} 🎒</span>
                <span className="font-semibold text-gray-900">{formatEUR(b.total_amount)}</span>
                <span className="text-gray-400">{timeAgo(b.created_at)}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-center">Mochilas</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => {
                const cfg = getStatusConfig(b.status);
                return (
                  <tr key={b.id} className="group hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/gestion/reservas/${b.id}`} className="font-mono text-xs font-semibold text-brand-700 underline-offset-2 group-hover:underline">
                        {b.booking_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/gestion/reservas/${b.id}`} className="text-gray-900 hover:underline">
                        {b.customer_name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{fmtDateShort(b.service_date)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{b.bags_count}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">{formatEUR(b.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.shortLabel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-400">{timeAgo(b.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
