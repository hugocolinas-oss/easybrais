"use client";

import { BrandLogo } from "@/components/brand-logo";
import { BrandRoutePattern } from "@/components/brand-route-pattern";
import { useT } from "@/lib/i18n/context";

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
