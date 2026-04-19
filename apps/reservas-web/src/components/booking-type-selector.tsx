"use client";

import type { BookingType } from "@/lib/types";

const OPTIONS: {
  value: BookingType;
  label: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "single_stage",
    label: "Un transporte",
    description: "Lleva tu equipaje entre dos puntos",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    value: "multi_stage",
    label: "Varias etapas",
    description: "Elige cuántas necesites",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    value: "full_camino",
    label: "Camino completo",
    description: "8 etapas del Camino Portugués",
    badge: "Mejor precio",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
];

interface Props {
  value: BookingType;
  onChange: (value: BookingType) => void;
}

export function BookingTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "group relative flex flex-row items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all sm:flex-col sm:items-center sm:py-5 sm:text-center",
              selected
                ? "border-brand-900 bg-white shadow-card ring-1 ring-brand-900/10"
                : "border-cream-300/80 bg-white/60 hover:border-cream-400 hover:bg-white hover:shadow-card",
            ].join(" ")}
          >
            {selected && (
              <span className="absolute -top-2 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-900 shadow-sm">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            )}
            {opt.badge && (
              <span className="absolute -top-2 left-3 rounded-full bg-gold-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                {opt.badge}
              </span>
            )}
            <span
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-11 sm:w-11",
                selected
                  ? "bg-gold-500/15 text-gold-700"
                  : "bg-cream-200/60 text-brand-800/30 group-hover:bg-cream-200 group-hover:text-brand-800/50",
              ].join(" ")}
            >
              {opt.icon}
            </span>
            <div className="min-w-0">
              <span
                className={[
                  "block text-sm font-bold",
                  selected ? "text-brand-900" : "text-brand-900/70",
                ].join(" ")}
              >
                {opt.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-brand-800/40 sm:text-xs">
                {opt.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
