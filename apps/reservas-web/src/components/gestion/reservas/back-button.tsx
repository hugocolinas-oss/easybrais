"use client";

import { useRouter } from "next/navigation";

export function BackToBookings() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors active:bg-gray-100 sm:hover:bg-gray-50"
    >
      ← Reservas
    </button>
  );
}
