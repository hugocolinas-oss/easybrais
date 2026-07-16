"use client";

import { BrandIcon } from "@/components/brand-icon";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useT } from "@/lib/i18n/context";

export function HeroSection() {
  const { t } = useT();

  return (
    <section className="relative mb-8 overflow-hidden border-b border-brand-900/15 pb-9 pt-1 sm:mb-10 sm:pb-11 sm:pt-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo
            size="md"
            className="rounded-lg bg-brand-900 ring-1 ring-brand-950/10"
            imgClassName="p-1.5"
            priority
          />
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-[-0.01em] text-brand-900">Easy Brais</p>
            <p className="truncate text-xs text-brand-800/60">{t("header.subtitle")}</p>
          </div>
        </div>
        <LocaleSwitcher tone="light" />
      </div>

      <div className="mt-7 grid gap-7 sm:mt-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(21rem,0.9fr)] lg:items-center lg:gap-14">
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-gold-700">
            <BrandIcon name="camino" className="h-4 w-4" />
            <span>{t("header.subtitle")}</span>
          </div>
          <h2 className="max-w-[36rem] text-balance text-[2.125rem] font-bold leading-[1.06] tracking-[-0.035em] text-brand-900 sm:text-[2.75rem]">
            {t("hero.title")}
          </h2>
          <p className="mt-4 max-w-[32rem] text-pretty text-[0.9375rem] leading-6 text-brand-800/68 sm:text-base">
            {t("hero.subtitle")}
          </p>
        </div>

        <ServiceTicket />
      </div>
    </section>
  );
}

function ServiceTicket() {
  const { t } = useT();

  return (
    <aside
      aria-labelledby="service-ticket-title"
      className="relative isolate overflow-hidden rounded-[1.125rem] border border-gold-700/25 bg-gold-50"
    >
      <span className="absolute -left-2 top-1/2 z-20 h-4 w-4 -translate-y-1/2 rounded-full border border-gold-700/20 bg-cream-100" />
      <span className="absolute -right-2 top-1/2 z-20 h-4 w-4 -translate-y-1/2 rounded-full border border-gold-700/20 bg-cream-100" />

      <div className="flex items-center justify-between border-b border-dashed border-gold-700/30 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <BrandIcon name="backpack" className="h-5 w-5 text-gold-700" />
          <h3 id="service-ticket-title" className="text-sm font-semibold text-brand-900">
            {t("service.card.title")}
          </h3>
        </div>
        <span className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-brand-800/45">EB · CP</span>
      </div>

      <div className="grid grid-cols-[1fr_4.75rem_1fr] items-center px-5 py-5 sm:px-6">
        <TicketStop
          align="left"
          label={t("service.pickup.label")}
          time="08:00"
          detail={t("service.pickup.value")}
        />

        <div className="flex items-center px-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-600" />
          <span className="h-px flex-1 border-t border-dashed border-brand-900/35" />
          <BrandIcon name="transport" className="h-5 w-5 shrink-0 text-brand-900" />
          <span className="h-px flex-1 border-t border-dashed border-brand-900/35" />
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-900" />
        </div>

        <TicketStop
          align="right"
          label={t("service.delivery.label")}
          time="15:30"
          detail={t("service.delivery.value")}
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-dashed border-gold-700/30 bg-white/35 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-brand-800/58">
          <BrandIcon name="euro" className="h-4 w-4 text-gold-700" />
          <span>{t("service.payment.label")}</span>
        </div>
        <p className="text-right text-xs font-semibold text-brand-900">{t("service.payment.value")}</p>
      </div>
    </aside>
  );
}

function TicketStop({
  align,
  label,
  time,
  detail,
}: {
  align: "left" | "right";
  label: string;
  time: string;
  detail: string;
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"} aria-label={`${label}: ${detail}`}>
      <p className="text-[0.6875rem] font-medium text-brand-800/55">{label}</p>
      <p className="mt-0.5 font-mono text-[1.375rem] font-semibold leading-none tracking-[-0.04em] text-brand-900 tabular-nums sm:text-2xl">
        {time}
      </p>
      <p className="mt-1 hidden text-[0.625rem] leading-4 text-brand-800/45 sm:block">{detail}</p>
    </div>
  );
}
