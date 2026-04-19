"use client";

import { useTransition, useState } from "react";
import type { CashClosureRow } from "@/lib/gestion/closure-queries";
import { deleteClosure } from "@/app/gestion/(dashboard)/cierres/actions";
import { ClosurePdfButton } from "./closure-pdf-button";

interface Props {
  rows: CashClosureRow[];
  total: number;
  page: number;
  totalPages: number;
  dateFrom?: string;
  dateTo?: string;
}

function eur(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fmtDate(iso: string): string {
  if (!iso || iso.length < 10) return iso ?? "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function ClosureTable({ rows, total, page, totalPages, dateFrom, dateTo }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
        <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-gray-500">
          No hay cierres contables registrados
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Genera el primer cierre usando el formulario superior.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Reservas</th>
              <th className="px-4 py-3 text-right">Mochilas</th>
              <th className="px-4 py-3 text-right">Bruto</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Dtos.</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Extras</th>
              <th className="px-4 py-3 text-right">Neto</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">Pendiente</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">Cancelaciones</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <ClosureRow key={r.id} closure={r} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
          <span>{total} cierres en total</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/gestion/cierres?page=${p}${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}`}
                className={`rounded px-2.5 py-1 font-medium ${
                  p === page
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClosureRow({ closure }: { closure: CashClosureRow }) {
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      await deleteClosure(closure.id);
      setShowConfirm(false);
    });
  }

  return (
    <>
      <tr className="hover:bg-gray-50/50">
        <td className="px-4 py-3 font-medium text-gray-900">
          {fmtDate(closure.closure_date)}
        </td>
        <td className="px-4 py-3 text-right font-semibold text-gray-900">
          {closure.total_bookings}
        </td>
        <td className="px-4 py-3 text-right text-gray-700">
          {closure.total_bags}
        </td>
        <td className="px-4 py-3 text-right text-gray-700">
          {eur(closure.gross_amount)}
        </td>
        <td className="hidden px-4 py-3 text-right text-green-600 sm:table-cell">
          {closure.discounts_amount > 0 ? `−${eur(closure.discounts_amount)}` : "—"}
        </td>
        <td className="hidden px-4 py-3 text-right text-amber-600 sm:table-cell">
          {closure.extras_amount > 0 ? `+${eur(closure.extras_amount)}` : "—"}
        </td>
        <td className="px-4 py-3 text-right font-bold text-gray-900">
          {eur(closure.net_amount)}
        </td>
        <td className="hidden px-4 py-3 text-right md:table-cell">
          {closure.pending_collection_amount > 0 ? (
            <span className="text-amber-600">{eur(closure.pending_collection_amount)}</span>
          ) : (
            <span className="text-green-600">Todo cobrado</span>
          )}
        </td>
        <td className="hidden px-4 py-3 text-right md:table-cell">
          {closure.cancellations_count > 0 ? (
            <span className="text-red-600">{closure.cancellations_count}</span>
          ) : (
            <span className="text-gray-400">0</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <ClosurePdfButton closure={closure} />
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="rounded p-1.5 text-gray-400 active:bg-gray-100 active:text-gray-600 sm:hidden sm:p-1"
              aria-label="Detalle"
            >
              <svg className={`h-5 w-5 transition-transform sm:h-4 sm:w-4 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showConfirm ? (
              <span className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded border border-gray-200 px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                title="Eliminar cierre"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Mobile expanded row */}
      {expanded && (
        <tr className="sm:hidden">
          <td colSpan={10} className="bg-gray-50 px-4 py-3">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="font-medium text-gray-500">Descuentos</dt>
                <dd className="text-green-600">
                  {closure.discounts_amount > 0 ? `−${eur(closure.discounts_amount)}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Extras</dt>
                <dd className="text-amber-600">
                  {closure.extras_amount > 0 ? `+${eur(closure.extras_amount)}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Pendiente cobro</dt>
                <dd className="text-amber-600">{eur(closure.pending_collection_amount)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Cancelaciones</dt>
                <dd>{closure.cancellations_count}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-medium text-gray-500">Generado</dt>
                <dd className="text-gray-600">
                  {new Date(closure.generated_at).toLocaleString("es-ES")}
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}
