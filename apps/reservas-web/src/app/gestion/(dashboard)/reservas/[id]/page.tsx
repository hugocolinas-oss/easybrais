import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEUR, fmtDateShort } from "@easybrais/utils";
import { getBookingDetail } from "@/lib/gestion/booking-queries";
import { getServerSupabase } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/gestion/reservas/status-badge";
import { StatusSelect } from "@/components/gestion/reservas/status-select";
import { NotesEditor } from "@/components/gestion/reservas/notes-editor";
import { EventTimeline } from "@/components/gestion/reservas/event-timeline";
import { BackToBookings } from "@/components/gestion/reservas/back-button";
import { PriceEditor } from "@/components/gestion/reservas/price-editor";
import { ItemBagsEditor } from "@/components/gestion/reservas/item-bags-editor";
import { ItemAccommodationEditor } from "@/components/gestion/reservas/item-accommodation-editor";
import { ItemServiceDateEditor } from "@/components/gestion/reservas/item-service-date-editor";
import { DeleteBookingButton } from "@/components/gestion/reservas/delete-booking-button";
import { BookingPdfButton } from "@/components/gestion/reservas/booking-pdf-button";
import { ResendEmailsButton } from "@/components/gestion/reservas/resend-emails-button";
import { getPaymentStatusConfig } from "@/lib/gestion/payment-status";
import { formatPhoneForDisplay, formatPhoneHref } from "@/lib/phone";
import { IncidentFlag } from "@/components/gestion/reservas/incident-flag";
import { requireAuth } from "@/lib/gestion/auth";
import {
  canDeleteBookings,
  canEditBookingPricing,
  canResendReservationEmails,
  ensureBookingsAccess,
} from "@/lib/gestion/permissions";

export const dynamic = "force-dynamic";

const CHANNEL_LABELS: Record<string, string> = {
  web: "Web pública",
  phone: "Teléfono",
  email: "Email",
  backoffice: "Backoffice",
  walk_in: "Presencial",
  partner: "Colaborador",
  other: "Otro",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAuth();
  ensureBookingsAccess(profile.role);
  const { id } = await params;
  const [booking, supabase] = await Promise.all([getBookingDetail(id), getServerSupabase()]);
  if (!booking) notFound();

  const { data: accRows } = await supabase
    .from("accommodations")
    .select("id, name, display_name, town")
    .eq("active", true)
    .order("name");

  type AccRow = { id: string; name: string; display_name: string | null; town: string | null };
  const accommodations = (accRows ?? []).map((a: AccRow) => ({
    id: a.id,
    name: a.name,
    display_name: a.display_name ?? a.name,
    town: a.town,
  }));

  const totalBags = booking.items.reduce((s, i) => s + i.bags_count, 0);
  const totalOverweight = booking.items.reduce((s, i) => s + i.overweight_bags_count, 0);
  const pay = getPaymentStatusConfig(booking.payment_status, booking.payment_expires_at);
  const customerPhoneDisplay = formatPhoneForDisplay(booking.customer.phone);
  const customerPhoneHref = formatPhoneHref(booking.customer.phone);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <BackToBookings />
        <h2 className="font-mono text-lg font-bold text-gray-900 sm:text-xl">{booking.booking_code}</h2>
        <StatusBadge status={booking.status} size="lg" />
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pay.cls}`}>{pay.label}</span>
        <span className="w-full text-xs text-gray-400 sm:ml-auto sm:w-auto">
          Servicio {fmtDateShort(booking.service_date)} · Creada {fmtDateTime(booking.created_at)}
        </span>
      </div>

      {/* Grid: detail + sidebar — stacks on mobile */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Customer card */}
          <Card title="Cliente">
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-sm">
              <Field label="Nombre" value={booking.customer.full_name} />
              <Field label="Idioma" value={booking.customer.language.toUpperCase()} />
              <div>
                <span className="text-xs text-gray-400">Email</span>
                {booking.customer.email ? (
                  <p className="text-sm">
                    <a href={`mailto:${booking.customer.email}`} className="text-brand-700 hover:underline">
                      {booking.customer.email}
                    </a>
                  </p>
                ) : (
                  <p className="text-sm text-gray-900">—</p>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-400">Teléfono</span>
                {customerPhoneDisplay && customerPhoneHref ? (
                  <p className="text-sm">
                    <a href={`tel:${customerPhoneHref}`} className="text-brand-700 hover:underline">
                      {customerPhoneDisplay}
                    </a>
                  </p>
                ) : (
                  <p className="text-sm text-gray-900">—</p>
                )}
              </div>
            </div>
            {booking.notes_customer && (
              <div className="mt-3 rounded-md bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-700">Observaciones del cliente</p>
                <p className="mt-1 text-sm text-amber-900">{booking.notes_customer}</p>
              </div>
            )}
          </Card>

          {/* Items / legs */}
          <Card title={`Tramos (${booking.items.length})`}>
            {/* Mobile: card list */}
            <div className="space-y-3 sm:hidden">
              {booking.items.map((item) => (
                <div key={item.id} className="rounded-md border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      <ItemServiceDateEditor itemId={item.id} serviceDate={item.service_date} />
                    </span>
                    <StatusBadge status={item.operational_status} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                    <ItemAccommodationEditor itemId={item.id} field="pickup" currentName={item.pickup_name} currentTown={item.pickup_town} accommodations={accommodations} />
                    <span className="shrink-0 text-gray-400">→</span>
                    <ItemAccommodationEditor itemId={item.id} field="dropoff" currentName={item.dropoff_name} currentTown={item.dropoff_town} accommodations={accommodations} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <ItemBagsEditor itemId={item.id} bagsCount={item.bags_count} overweightBagsCount={item.overweight_bags_count} />
                      <span>mochilas{item.overweight_bags_count > 0 ? ` (+${item.overweight_bags_count} sob.)` : ""}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatEUR(item.line_total)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden overflow-x-auto -mx-5 sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-2">Fecha</th>
                    <th className="px-5 py-2">Recogida</th>
                    <th className="px-5 py-2">Entrega</th>
                    <th className="px-5 py-2 text-center">Mochilas</th>
                    <th className="px-5 py-2 text-center">Sobrepeso</th>
                    <th className="px-5 py-2 text-right">Precio ud.</th>
                    <th className="px-5 py-2 text-right">Línea</th>
                    <th className="px-5 py-2">Op.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {booking.items.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-5 py-2.5 text-gray-700">
                        <ItemServiceDateEditor itemId={item.id} serviceDate={item.service_date} />
                      </td>
                      <td className="px-5 py-2.5">
                        <ItemAccommodationEditor itemId={item.id} field="pickup" currentName={item.pickup_name} currentTown={item.pickup_town} accommodations={accommodations} />
                      </td>
                      <td className="px-5 py-2.5">
                        <ItemAccommodationEditor itemId={item.id} field="dropoff" currentName={item.dropoff_name} currentTown={item.dropoff_town} accommodations={accommodations} />
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <ItemBagsEditor itemId={item.id} bagsCount={item.bags_count} overweightBagsCount={item.overweight_bags_count} />
                      </td>
                      <td className="px-5 py-2.5 text-center text-gray-500">
                        {item.overweight_bags_count > 0 ? item.overweight_bags_count : "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right text-gray-500">{formatEUR(item.unit_price)}</td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right font-medium text-gray-900">{formatEUR(item.line_total)}</td>
                      <td className="px-5 py-2.5"><StatusBadge status={item.operational_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Events */}
          <Card title="Historial de eventos">
            <EventTimeline events={booking.events} />
          </Card>
        </div>

        {/* Right column (sidebar) */}
        <div className="space-y-4">
          <Card title="Estado">
            <StatusSelect bookingId={booking.id} currentStatus={booking.status} />
          </Card>

          <Card title="Importes">
            <div className="space-y-2 text-sm">
              <Row label={`${totalBags} mochilas`} value={formatEUR(booking.subtotal_amount)} />
              {booking.discount_amount > 0 && (
                <Row label="Dto. volumen" value={`−${formatEUR(booking.discount_amount)}`} cls="text-green-700" />
              )}
              {booking.extra_weight_amount > 0 && (
                <Row
                  label={`Sobrepeso (${totalOverweight})`}
                  value={`+${formatEUR(booking.extra_weight_amount)}`}
                  cls="text-amber-700"
                />
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  {canEditBookingPricing(profile.role) ? (
                    <PriceEditor bookingId={booking.id} currentTotal={booking.total_amount} />
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">{formatEUR(booking.total_amount)}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Info">
            <div className="space-y-2 text-sm">
              <Field label="Canal" value={CHANNEL_LABELS[booking.source_channel] ?? booking.source_channel} />
              <Field label="Idioma" value={booking.language.toUpperCase()} />
              <div>
                <span className="text-xs text-gray-400">Pago</span>
                <p className={`text-sm font-medium ${pay.cls}`}>{pay.label}</p>
              </div>
              <Field label="Email conf." value={booking.email_status === "sent" ? "Enviado ✓" : booking.email_status === "failed" ? "Fallido ✗" : "No enviado"} />
              <Field label="Actualizada" value={fmtDateTime(booking.updated_at)} />
            </div>
          </Card>

          {booking.incident_reason && (
            <Card title="Incidencia">
              <div className="space-y-2">
                <IncidentFlag reason={booking.incident_reason} />
                {booking.incident_reported_at && (
                  <p className="text-xs text-gray-500">Registrada el {fmtDateTime(booking.incident_reported_at)}</p>
                )}
              </div>
            </Card>
          )}

          {(booking.stripe_session_id || booking.stripe_payment_intent || booking.payment_method) && (
            <Card title="Pago online">
              <div className="space-y-2 text-sm">
                {booking.payment_method && (
                  <Field label="Método" value={booking.payment_method === "online_stripe" ? "Stripe (tarjeta)" : booking.payment_method} />
                )}
                {booking.paid_at && (
                  <Field label="Pagado el" value={fmtDateTime(booking.paid_at)} />
                )}
                {booking.payment_expires_at && !booking.paid_at && (
                  <div>
                    <span className="text-xs text-gray-400">Expira</span>
                    <p className={`text-sm font-medium ${new Date(booking.payment_expires_at) < new Date() ? "text-red-600" : "text-amber-600"}`}>
                      {fmtDateTime(booking.payment_expires_at)}
                      {new Date(booking.payment_expires_at) < new Date() && " (expirado)"}
                    </p>
                  </div>
                )}
                {booking.stripe_payment_intent && (
                  <div>
                    <span className="text-xs text-gray-400">Payment Intent</span>
                    <p className="break-all font-mono text-xs text-gray-700">
                      <a
                        href={`https://dashboard.stripe.com/payments/${booking.stripe_payment_intent}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 hover:underline"
                      >
                        {booking.stripe_payment_intent}
                      </a>
                    </p>
                  </div>
                )}
                {booking.stripe_session_id && (
                  <div>
                    <span className="text-xs text-gray-400">Session ID</span>
                    <p className="break-all font-mono text-xs text-gray-500">{booking.stripe_session_id}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card title="Notas internas">
            <NotesEditor bookingId={booking.id} initialNotes={booking.notes_internal ?? ""} />
          </Card>

          <BookingPdfButton booking={booking} />

          {canResendReservationEmails(profile.role) && <ResendEmailsButton bookingId={booking.id} />}

          {canDeleteBookings(profile.role) && (
            <DeleteBookingButton bookingId={booking.id} bookingCode={booking.booking_code} />
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400">{label}</span>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function Row({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className={`flex justify-between ${cls ?? "text-gray-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
