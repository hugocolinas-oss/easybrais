"use client";

import { formatEUR, fmtDateShort, PRICING_RULES } from "@easybrais/utils";
import type { BookingSuccess } from "@/app/actions";

interface Props {
  result: BookingSuccess;
  onNewBooking: () => void;
}

export function BookingConfirmation({ result, onNewBooking }: Props) {
  const { pricing } = result;
  const { VOLUME_DISCOUNT, OVERWEIGHT_FEE } = PRICING_RULES;

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-cream-300/80 bg-white shadow-soft">
        {/* Success banner */}
        <div className="relative overflow-hidden bg-brand-900 px-6 py-8 text-center sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,154,108,0.12),transparent_60%)]" aria-hidden="true" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">Reserva recibida</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
              Tu solicitud ha sido registrada correctamente.
            </p>
          </div>
        </div>

        {/* Booking code */}
        <div className="-mt-5 px-6 sm:px-8">
          <div className="rounded-xl border border-cream-300/80 bg-cream-50 px-5 py-4 text-center shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-800/40">
              Tu código de reserva
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-brand-900 sm:text-3xl">
              {result.bookingCode}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pt-6 sm:px-8">
          <dl className="divide-y divide-cream-200/60 text-sm">
            <DetailRow label="Cliente" value={result.customerName} />
            <DetailRow label="Email" value={result.email} />
            <DetailRow label="Primera fecha" value={fmtDateShort(result.firstServiceDate)} />
            <DetailRow label="Transportes" value={String(result.legsCount)} />
            <DetailRow
              label="Mochilas"
              value={
                pricing.totalOverweightBags > 0
                  ? `${pricing.totalBags} (${pricing.totalOverweightBags} con sobrepeso)`
                  : String(pricing.totalBags)
              }
            />
            <DetailRow label="Estado" value="Pendiente de confirmación" accent />
          </dl>
        </div>

        {/* Pricing breakdown */}
        <div className="mx-6 mt-4 overflow-hidden rounded-xl border border-cream-300/60 bg-cream-50 sm:mx-8">
          <div className="border-b border-cream-300/40 bg-cream-100/50 px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-800/40">Desglose de precios</p>
          </div>
          <div className="space-y-1.5 px-4 py-3 text-sm">
            {pricing.subtotalAmount > 0 && (
              <div className="flex justify-between text-brand-800/60">
                <span>Subtotal transporte ({pricing.totalBags} {pricing.totalBags === 1 ? "mochila" : "mochilas"})</span>
                <span>{formatEUR(pricing.subtotalAmount)}</span>
              </div>
            )}
            {pricing.discountedBags > 0 && (
              <div className="flex justify-between text-sage-700">
                <span className="flex items-center gap-1.5">
                  Dto. volumen ({pricing.discountedBags} × −{formatEUR(VOLUME_DISCOUNT)})
                  <span className="rounded bg-sage-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sage-600">Ahorro</span>
                </span>
                <span>−{formatEUR(pricing.discountAmount)}</span>
              </div>
            )}
            {pricing.extraWeightAmount > 0 && (
              <div className="flex justify-between text-gold-700">
                <span>Sobrepeso ({pricing.totalOverweightBags} × {formatEUR(OVERWEIGHT_FEE)})</span>
                <span>+{formatEUR(pricing.extraWeightAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-cream-300/60 pt-2 font-bold text-brand-900">
              <span>Total</span>
              <span className="text-lg text-gold-600">{formatEUR(pricing.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Info notice */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-sage-200/50 bg-sage-50/60 p-3.5 sm:mx-8">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-sage-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-[11px] leading-relaxed text-brand-800/50">
            Guarda tu código <strong className="font-semibold text-brand-900">{result.bookingCode}</strong>.
            Recibirás confirmación en <strong className="font-semibold text-brand-900">{result.email}</strong>.
          </p>
        </div>

        {/* Action */}
        <div className="p-6 sm:p-8">
          <button
            type="button"
            onClick={onNewBooking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 active:scale-[0.98]"
          >
            Hacer otra reserva
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between py-2.5">
      <dt className="text-brand-800/40">{label}</dt>
      <dd className={`text-right font-medium ${accent ? "text-gold-600" : "text-brand-900"}`}>{value}</dd>
    </div>
  );
}
