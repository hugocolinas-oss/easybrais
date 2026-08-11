import { createAdminClient } from "@easybrais/utils/supabase/admin";
import Link from "next/link";
import { StripeCheckoutButton } from "@/components/stripe-checkout-button";

interface Props {
  searchParams: Promise<{ booking_id?: string; booking_code?: string }>;
}

export default async function PaymentCancelledPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookingId = params.booking_id;
  const requestedBookingCode = params.booking_code;
  let bookingCode: string | null = null;

  if (bookingId && requestedBookingCode) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("bookings")
      .select("booking_code")
      .eq("id", bookingId)
      .eq("booking_code", requestedBookingCode)
      .single();
    bookingCode = data?.booking_code ?? null;
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-cream-300/80 bg-white shadow-soft">
        {/* Warning banner */}
        <div className="relative overflow-hidden bg-brand-900 px-6 py-8 text-center sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,154,108,0.12),transparent_60%)]" aria-hidden="true" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">Pago no completado</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
              El proceso de pago ha sido cancelado. Tu reserva está pendiente de pago.
            </p>
          </div>
        </div>

        {/* Booking code if available */}
        {bookingCode && (
          <div className="-mt-5 px-6 sm:px-8">
            <div className="rounded-xl border border-cream-300/80 bg-cream-50 px-5 py-4 text-center shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-800/40">
                Tu reserva
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-brand-900 sm:text-3xl">
                {bookingCode}
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="px-6 pt-6 sm:px-8">
          <div className="flex items-start gap-2.5 rounded-xl border border-gold-200/50 bg-gold-50/40 p-4">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div className="text-xs leading-relaxed text-brand-800/60">
              <p className="font-semibold text-brand-900">No se ha realizado ningún cargo.</p>
              <p className="mt-1">
                Si has cambiado de opinión, puedes volver a hacer una reserva en cualquier momento.
                {bookingCode && (
                  <> Si necesitas ayuda con la reserva <strong>{bookingCode}</strong>, contacta con nosotros.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 p-6 sm:p-8">
          {bookingCode && bookingId && (
            <StripeCheckoutButton bookingId={bookingId} bookingCode={bookingCode} />
          )}
          <Link
            href="/"
            className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 active:scale-[0.98] ${
              bookingCode
                ? "border border-brand-200 bg-white text-brand-900 hover:bg-cream-50"
                : "bg-brand-900 text-white shadow-md hover:bg-brand-800 hover:shadow-lg"
            }`}
          >
            Hacer una nueva reserva
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Security notice */}
        <div className="border-t border-cream-200 px-6 py-3 sm:px-8">
          <div className="flex items-center justify-center gap-2 text-[11px] text-brand-800/35">
            <svg className="h-3.5 w-3.5 shrink-0 text-sage-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>Pago seguro procesado por Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
