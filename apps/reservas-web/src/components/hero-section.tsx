"use client";

import { useT } from "@/lib/i18n/context";

function BackpackLogo() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12 sm:h-14 sm:w-14"
      aria-hidden="true"
    >
      {/* Asa superior */}
      <path
        d="M22 16c0-5 4-9 10-9s10 4 10 9"
        stroke="#C49A6C"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cuerpo principal */}
      <path
        d="M14 22c0-3.3 2.7-6 6-6h24c3.3 0 6 2.7 6 6v28c0 3.3-2.7 6-6 6H20c-3.3 0-6-2.7-6-6V22z"
        fill="#C49A6C"
      />
      {/* Sombra cuerpo */}
      <path
        d="M14 36v14c0 3.3 2.7 6 6 6h24c3.3 0 6-2.7 6-6V36H14z"
        fill="#A3855A"
      />
      {/* Bolsillo frontal */}
      <rect x="20" y="34" width="24" height="14" rx="3" fill="#F0EAD2" />
      {/* Cremallera bolsillo */}
      <line x1="22" y1="41" x2="42" y2="41" stroke="#A3855A" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="38" cy="41" r="1.5" fill="#003C2F" />
      {/* Tira frontal superior */}
      <rect x="20" y="22" width="24" height="8" rx="2" fill="#F0EAD2" />
      <line x1="22" y1="26" x2="42" y2="26" stroke="#A3855A" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="38" cy="26" r="1.5" fill="#003C2F" />
      {/* Correas laterales */}
      <rect x="10" y="24" width="4" height="20" rx="2" fill="#A3855A" />
      <rect x="50" y="24" width="4" height="20" rx="2" fill="#A3855A" />
    </svg>
  );
}

export function HeroSection() {
  const { t } = useT();

  return (
    <div className="mb-8 text-center sm:mb-12">
      <div className="mb-5 flex justify-center sm:mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-brand-900 to-brand-700 shadow-[0_18px_45px_rgba(22,50,40,0.18)] ring-1 ring-gold-300/30 sm:h-24 sm:w-24">
          <BackpackLogo />
        </div>
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
