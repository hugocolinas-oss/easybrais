import { createAdminClient, formatEUR, fmtDateShort } from "@easybrais/utils";
import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { getPaymentStatusConfig } from "@/lib/gestion/payment-status";

interface Props {
  searchParams: Promise<{ session_id?: string; booking_id?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookingId = params.booking_id;

  if (!bookingId) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-800/50">Parámetros inválidos.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-900 underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `id, booking_code, service_date, total_amount, subtotal_amount,
       discount_amount, extra_weight_amount, payment_status, payment_expires_at, status,
       notes_customer,
       customers(full_name, email),
       booking_items(
         service_date, bags_count, overweight_bags_count,
         pickup_accommodation:accommodations!booking_items_pickup_accommodation_id_fkey(name, town),
         dropoff_accommodation:accommodations!booking_items_dropoff_accommodation_id_fkey(name, town)
       )`,
    )
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-800/50">Reserva no encontrada.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-900 underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const customer = booking.customers as unknown as { full_name: string; email: string } | null;
  const items = (booking.booking_items ?? []) as unknown as Array<{
    service_date: string;
    bags_count: number;
    overweight_bags_count: number;
    pickup_accommodation: { name: string; town: string | null } | null;
    dropoff_accommodation: { name: string; town: string | null } | null;
  }>;

  const isPaid = booking.payment_status === "paid";
  const paymentConfig = getPaymentStatusConfig(
    booking.payment_status,
    (booking as { payment_expires_at?: string | null }).payment_expires_at,
  );

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-cream-300/80 bg-white shadow-soft">
        {/* Success banner */}
        <div className="relative overflow-hidden bg-brand-900 px-6 py-8 text-center sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,154,108,0.12),transparent_60%)]" aria-hidden="true" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10 p-1 ring-1 ring-white/25 shadow-lg backdrop-blur-sm">
              <Image src={BRAND_LOGO_SRC} alt="Easy Brais" width={56} height={56} className="object-contain" />
            </div>
            <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              {isPaid ? (
                <svg className="h-4 w-4 text-gold-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4 animate-pulse text-gold-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              {isPaid ? "Pago confirmado" : "Reserva confirmada"}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
              {isPaid
                ? "Tu reserva está confirmada y el pago se ha procesado correctamente."
                : "Tu reserva ya está confirmada. El pago se actualizará en cuanto Stripe lo valide."}
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
              {booking.booking_code}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pt-6 sm:px-8">
          <dl className="divide-y divide-cream-200/60 text-sm">
            {customer && (
              <>
                <Row label="Cliente" value={customer.full_name} />
                <Row label="Email" value={customer.email} />
              </>
            )}
            <Row label="Primera fecha" value={fmtDateShort(booking.service_date)} />
            <Row label="Transportes" value={String(items.length)} />
            <Row
              label="Estado"
              value={isPaid ? "Confirmada y pagada" : `Confirmada · ${paymentConfig.label.toLowerCase()}`}
              accent
            />
          </dl>
        </div>

        {/* Items summary */}
        {items.length > 0 && (
          <div className="mx-6 mt-4 overflow-hidden rounded-xl border border-cream-300/60 bg-cream-50 sm:mx-8">
            <div className="border-b border-cream-300/40 bg-cream-100/50 px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-800/40">Transportes</p>
            </div>
            <div className="divide-y divide-cream-200/40">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold-500/15 text-[10px] font-bold text-gold-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-brand-900">
                      {it.pickup_accommodation?.name ?? "—"} → {it.dropoff_accommodation?.name ?? "—"}
                    </p>
                    <p className="text-brand-800/40">
                      {fmtDateShort(it.service_date)} · {it.bags_count} {it.bags_count === 1 ? "mochila" : "mochilas"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mx-6 mt-4 overflow-hidden rounded-xl border border-cream-300/60 bg-cream-50 sm:mx-8">
          <div className="space-y-1.5 px-4 py-3 text-sm">
            <div className="flex justify-between text-brand-800/60">
              <span>Subtotal</span>
              <span>{formatEUR(booking.subtotal_amount)}</span>
            </div>
            {booking.discount_amount > 0 && (
              <div className="flex justify-between text-sage-700">
                <span>Descuento volumen</span>
                <span>−{formatEUR(booking.discount_amount)}</span>
              </div>
            )}
            {booking.extra_weight_amount > 0 && (
              <div className="flex justify-between text-gold-700">
                <span>Sobrepeso</span>
                <span>+{formatEUR(booking.extra_weight_amount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-cream-300/60 pt-2 font-bold text-brand-900">
              <span>{isPaid ? "Total pagado" : "Total"}</span>
              <span className="text-lg text-gold-600">{formatEUR(booking.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Info notice */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-sage-200/50 bg-sage-50/60 p-3.5 sm:mx-8">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-sage-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-[11px] leading-relaxed text-brand-800/50">
            {isPaid
              ? <>Recibirás un email de confirmación con la factura en <strong className="font-semibold text-brand-900">{customer?.email}</strong>.</>
              : <>Guarda tu código <strong className="font-semibold text-brand-900">{booking.booking_code}</strong>. Tu reserva ya está confirmada y el estado del pago se actualizará en <strong className="font-semibold text-brand-900">{customer?.email}</strong>.</>}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 sm:p-8">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 active:scale-[0.98]"
          >
            Hacer otra reserva
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Payment guarantee */}
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

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between py-2.5">
      <dt className="text-brand-800/40">{label}</dt>
      <dd className={`text-right font-medium ${accent ? "text-gold-600" : "text-brand-900"}`}>{value}</dd>
    </div>
  );
}
