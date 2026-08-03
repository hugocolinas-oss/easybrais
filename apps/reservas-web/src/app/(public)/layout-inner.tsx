"use client";

import { BrandLogo } from "@/components/brand-logo";
import { BrandIcon } from "@/components/brand-icon";
import { BrandRoutePattern } from "@/components/brand-route-pattern";
import { useT } from "@/lib/i18n/context";

const WHATSAPP_URL =
  "https://wa.me/34603327708?text=Hola%20Easy%20Brais%2C%20necesito%20ayuda%20con%20mi%20reserva";

export function PublicLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useT();

  return (
    <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)", background: "var(--background)" }}>
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-900 shadow-md transition-transform focus:translate-y-0"
      >
        Ir al contenido
      </a>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsapp.help")}
        title={t("whatsapp.help")}
        className="group fixed z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_32px_rgba(11,61,46,0.28)] ring-4 ring-white/80 transition hover:-translate-y-1 hover:bg-[#20BD5A] hover:shadow-[0_16px_38px_rgba(11,61,46,0.34)] focus-visible:-translate-y-1 sm:h-16 sm:w-16"
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          right: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <span className="pointer-events-none absolute right-[calc(100%+0.75rem)] hidden whitespace-nowrap rounded-lg bg-brand-950 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
          {t("whatsapp.help")}
        </span>
        <BrandIcon name="whatsapp" className="h-7 w-7 sm:h-8 sm:w-8" />
        <span className="sr-only">{t("whatsapp.help")}</span>
      </a>
      {/* Main */}
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-3 sm:px-6 sm:py-5">{children}</main>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-cream-300/50 bg-cream-100/90">
        <BrandRoutePattern className="absolute inset-x-0 top-0 h-full w-full opacity-45" />
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="xs" className="opacity-90 ring-1 ring-brand-900/10" imgClassName="p-px" />
              <p className="text-xs font-medium text-brand-900/45">Easy Brais</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-brand-900/30">
              <span>{t("footer.transport")}</span>
              <span className="hidden sm:inline">·</span>
              <span>{t("header.subtitle")}</span>
              <span className="hidden sm:inline">·</span>
              <span>{t("footer.delivery")}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
