"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { RouteStop } from "@/lib/gestion/route-queries";
import { toggleStopCompleted, swapStopPositions } from "@/app/gestion/(dashboard)/ruta/actions";

interface Props {
  stop: RouteStop;
  routeId: string;
  isFirst: boolean;
  isLast: boolean;
  totalStops: number;
}

export function StopRow({ stop, routeId, isFirst, isLast }: Props) {
  const [pending, startTransition] = useTransition();

  const isPickup = stop.stop_type === "pickup";

  function handleToggle() {
    startTransition(async () => {
      await toggleStopCompleted(stop.id, !stop.completed);
    });
  }

  function handleMove(dir: "up" | "down") {
    startTransition(async () => {
      await swapStopPositions(routeId, stop.id, dir);
    });
  }

  return (
    <div
      className={`group relative flex items-stretch gap-0 transition-opacity ${
        stop.completed ? "opacity-60" : ""
      }`}
    >
      {/* Timeline */}
      <div className="flex w-10 shrink-0 flex-col items-center">
        {!isFirst && <div className="w-0.5 flex-1 bg-gray-200" />}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
            stop.completed
              ? "border-green-500 bg-green-50 text-green-600"
              : isPickup
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-indigo-400 bg-indigo-50 text-indigo-700"
          }`}
        >
          {stop.completed ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            stop.position
          )}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200" />}
      </div>

      {/* Card */}
      <div
        className={`mb-2 ml-2 flex-1 rounded-lg border bg-white shadow-sm transition-all ${
          stop.completed
            ? "border-green-200"
            : isPickup
              ? "border-amber-200"
              : "border-indigo-200"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Checkbox — larger touch target */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={pending}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors sm:h-5 sm:w-5 sm:rounded sm:border ${
              stop.completed
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-300 active:border-brand-500"
            }`}
            aria-label={stop.completed ? "Desmarcar" : "Marcar completada"}
          >
            {stop.completed && (
              <svg className="h-4 w-4 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>

          {/* Type badge */}
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              isPickup
                ? "bg-amber-100 text-amber-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {isPickup ? "Recogida" : "Entrega"}
          </span>

          {/* Accommodation */}
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-semibold ${stop.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
              {stop.accommodation_name}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-400">
              {stop.accommodation_town && <span>{stop.accommodation_town}</span>}
              {stop.accommodation_address && (
                <span className="hidden truncate max-w-[200px] lg:inline" title={stop.accommodation_address}>
                  · {stop.accommodation_address}
                </span>
              )}
            </div>
          </div>

          {/* Booking + customer */}
          <div className="hidden shrink-0 text-right sm:block">
            {stop.booking_id ? (
              <Link href={`/gestion/reservas/${stop.booking_id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                {stop.booking_code}
              </Link>
            ) : (
              <p className="font-mono text-xs font-semibold text-brand-600">{stop.booking_code}</p>
            )}
            <p className="text-xs text-gray-400">{stop.customer_name}</p>
            {stop.customer_phone && (
              <div className="flex items-center gap-1.5">
                <a href={`tel:${stop.customer_phone}`} className="text-[10px] text-brand-500 hover:underline">
                  {stop.customer_phone}
                </a>
                <a
                  href={`https://wa.me/${stop.customer_phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600"
                  title="Contactar por WhatsApp"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.61l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.607-.798-6.378-2.143l-.446-.344-2.914.977.977-2.914-.344-.446A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Bags */}
          <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
            {stop.bags_count} 🎒
          </span>

          {/* Reorder — always visible on mobile for touch */}
          <div className="flex shrink-0 flex-col gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => handleMove("up")}
              disabled={pending || isFirst}
              className="rounded p-1.5 text-gray-400 active:bg-gray-100 active:text-gray-600 disabled:opacity-20 sm:p-0.5"
              aria-label="Subir"
            >
              <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleMove("down")}
              disabled={pending || isLast}
              className="rounded p-1.5 text-gray-400 active:bg-gray-100 active:text-gray-600 disabled:opacity-20 sm:p-0.5"
              aria-label="Bajar"
            >
              <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile extra info */}
        <div className="border-t border-gray-100 px-4 py-2 sm:hidden">
          {stop.booking_id ? (
            <Link href={`/gestion/reservas/${stop.booking_id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
              {stop.booking_code}
            </Link>
          ) : (
            <p className="font-mono text-xs font-semibold text-brand-600">{stop.booking_code}</p>
          )}
          <p className="text-xs text-gray-400">{stop.customer_name}</p>
          {stop.customer_phone && (
            <div className="flex items-center gap-2">
              <a href={`tel:${stop.customer_phone}`} className="text-xs text-brand-500 hover:underline">
                {stop.customer_phone}
              </a>
              <a
                href={`https://wa.me/${stop.customer_phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600"
                title="WhatsApp"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.61l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.607-.798-6.378-2.143l-.446-.344-2.914.977.977-2.914-.344-.446A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Notes / address on mobile */}
        {(stop.notes || stop.accommodation_address) && (
          <div className="border-t border-gray-100 px-4 py-2">
            {stop.accommodation_address && (
              <p className="text-xs text-gray-400 lg:hidden">{stop.accommodation_address}</p>
            )}
            {stop.notes && (
              <p className="text-xs text-gray-500">{stop.notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
