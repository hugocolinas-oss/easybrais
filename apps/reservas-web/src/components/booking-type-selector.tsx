"use client";

import type { BookingType } from "@/lib/types";
import { useT } from "@/lib/i18n/context";
import { BrandIconTile, type BrandIconName } from "@/components/brand-icon";

interface Props {
  value: BookingType;
  onChange: (value: BookingType) => void;
}

export function BookingTypeSelector({ value, onChange }: Props) {
  const { t } = useT();

  const OPTIONS: {
    value: BookingType;
    label: string;
    description: string;
    icon: BrandIconName;
  }[] = [
    {
      value: "single_stage",
      label: t("type.single"),
      description: t("type.single.desc"),
      icon: "location",
    },
    {
      value: "multi_stage",
      label: t("type.multi"),
      description: t("type.multi.desc"),
      icon: "route",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("section.type")}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            role="radio"
            aria-checked={selected}
            className={[
              "group relative flex min-h-20 flex-row items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-[border-color,background-color,color,transform] active:scale-[0.99] sm:min-h-28 sm:px-5",
              selected
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-cream-300 bg-white text-brand-900 hover:border-brand-300 hover:bg-brand-50/50",
            ].join(" ")}
          >
            {selected && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400">
                <svg className="h-3 w-3 text-brand-950" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            )}
            <BrandIconTile
              name={opt.icon}
              size="lg"
              tone={selected ? "dark" : "light"}
              className="transition-colors group-hover:ring-brand-200"
            />
            <div className="min-w-0">
              <span
                className={[
                  "block text-sm font-bold",
                  selected ? "text-white" : "text-brand-900",
                ].join(" ")}
              >
                {opt.label}
              </span>
              <span className={`mt-1 block text-xs leading-relaxed ${selected ? "text-white/65" : "text-brand-800/60"}`}>
                {opt.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
