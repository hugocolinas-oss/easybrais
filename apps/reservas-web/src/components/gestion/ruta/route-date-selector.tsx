"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  currentDate: string;
}

export function RouteDateSelector({ currentDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (date: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", date);
      router.push(`/ruta?${params.toString()}`);
    },
    [router, searchParams],
  );

  function shiftDay(offset: number) {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + offset);
    navigate(d.toISOString().split("T")[0] ?? currentDate);
  }

  const todayStr = new Date().toISOString().split("T")[0] ?? "";
  const isToday = currentDate === todayStr;

  const displayDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(currentDate + "T12:00:00"));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="px-3 py-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          aria-label="Día anterior"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => navigate(e.target.value)}
          className="border-x border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => shiftDay(1)}
          className="px-3 py-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          aria-label="Día siguiente"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {!isToday && (
        <button
          type="button"
          onClick={() => navigate(todayStr)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
        >
          Hoy
        </button>
      )}

      <p className="text-sm capitalize text-gray-500">{displayDate}</p>
    </div>
  );
}
