"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useT } from "@/lib/i18n/context";

export function HeroSection() {
  const { t } = useT();

  return (
    <div className="mb-8 text-center sm:mb-12">
      <div className="mb-4 flex justify-center sm:justify-end">
        <LocaleSwitcher />
      </div>
      <div className="mb-5 flex justify-center sm:mb-6">
        <BrandLogo
          size="xl"
          className="shadow-[0_18px_45px_rgba(11,61,46,0.22)] ring-1 ring-black/[0.06]"
          imgClassName="p-1.5"
          priority
        />
      </div>
      <h2 className="text-balance text-2xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">
        {t("hero.title")}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-brand-800/60 sm:mt-4 sm:text-base">
        {t("hero.subtitle")}
      </p>

      <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:mt-8">
        <TrustBadge icon="clock" text={t("trust.pickup")} />
        <TrustBadge icon="shield" text={t("trust.secure")} />
        <TrustBadge icon="clock" text={t("trust.delivery")} />
        <TrustBadge icon="check" text={t("trust.email")} />
      </div>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: "shield" | "clock" | "check"; text: string }) {
  const icons = {
    shield: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    clock: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    check: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-brand-800/50">
      <span className="text-sage-500">{icons[icon]}</span>
      {text}
    </div>
  );
}
