export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)", background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-brand-900/[.98] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400/25 to-gold-600/15 ring-1 ring-gold-400/20">
              <svg className="h-[18px] w-[18px] text-gold-400" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">Easy Brais</h1>
              <p className="hidden text-[10px] font-medium text-white/30 sm:block">Camino Portugués</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-white/[.07] px-3 py-1.5 ring-1 ring-white/[.08]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <span className="text-[11px] font-medium text-white/70">Servicio activo</span>
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
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900/5">
                <svg className="h-3.5 w-3.5 text-brand-900/30" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-brand-900/35">Easy Brais</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-brand-900/25">
              <span>Transporte de equipaje</span>
              <span className="hidden sm:inline">·</span>
              <span>Camino Portugués</span>
              <span className="hidden sm:inline">·</span>
              <span>Entrega antes de las 15:30</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
