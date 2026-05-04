"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n/context";

export function PublicLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useT();

  return (
    <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)", background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-brand-900/[.98] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gold-400/25 to-gold-600/15 ring-1 ring-gold-400/20">
              <Image src="/brand-logo.png" alt="Easy Brais" fill className="object-contain p-0.5" sizes="36px" priority />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">Easy Brais</h1>
              <p className="hidden text-[10px] font-medium text-white/30 sm:block">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-white/[.07] px-3 py-1.5 ring-1 ring-white/[.08]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <span className="text-[11px] font-medium text-white/70">{t("header.active")}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-cream-300/40 bg-cream-100/80">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-900/5">
                <Image src="/brand-logo.png" alt="Easy Brais" fill className="object-contain p-0.5 opacity-80" sizes="28px" />
              </div>
              <p className="text-xs font-medium text-brand-900/35">Easy Brais</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-brand-900/25">
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
