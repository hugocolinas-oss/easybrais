import Image from "next/image";
import { BRAND_LOGO_SRC } from "@/lib/brand";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-[var(--background)]">
      <div className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-md ring-1 ring-brand-900/10">
        <Image src={BRAND_LOGO_SRC} alt="" fill className="object-contain p-1 opacity-90" sizes="56px" />
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-white/25" aria-hidden />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="h-2 w-2 animate-spin rounded-full border-2 border-cream-300 border-t-brand-900" />
        <p className="text-sm font-medium text-brand-800/40">Cargando...</p>
      </div>
    </div>
  );
}
