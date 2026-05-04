import "server-only";

import { createAdminClient } from "@easybrais/utils";
import { generateInvoicePdf, type InvoiceData } from "@easybrais/utils/pdf";
import { getSmtpConfig, sendEmail, type EmailAttachment } from "@easybrais/utils/email";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

const EMAIL_PROVIDER = "brevo_smtp";
const ADMIN_TEMPLATE = "admin_new_reservation";
const CUSTOMER_TEMPLATE = "customer_reservation_confirmation";
const CUSTOMER_PAYMENT_TEMPLATE = "customer_payment_confirmed";

interface ReservationEmailContext {
  bookingId: string;
  bookingCode: string;
  serviceDate: string;
  bookingType: string;
  customerName: string;
  customerFirstName: string;
  customerEmail: string | null;
  customerPhone: string;
  comments: string;
  language: string;
  totalPrice: number;
  subtotalAmount: number;
  discountAmount: number;
  extraWeightAmount: number;
  items: Array<{
    serviceDate: string;
    bagsCount: number;
    overweightBagsCount: number;
    pickupName: string;
    dropoffName: string;
  }>;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

function formatPrice(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2br(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function getCustomerFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first || "cliente";
}

function getOverweightText(items: ReservationEmailContext["items"]): string {
  const count = items.reduce((sum, item) => sum + item.overweightBagsCount, 0);
  return count > 0 ? String(count) : "Non";
}

function getPdfAttachmentName(bookingCode: string): string {
  return `reserva-${bookingCode}.pdf`;
}

async function getReservationEmailContext(
  supabase: SupabaseAdmin,
  bookingId: string,
): Promise<ReservationEmailContext | null> {
  const { data } = await supabase
    .from("bookings")
    .select(
      `id, booking_code, service_date, booking_type, language, notes_customer,
      subtotal_amount, discount_amount, extra_weight_amount, total_amount,
      customers(full_name, email, phone, language),
      booking_items(
        service_date, bags_count, overweight_bags_count,
        pickup_accommodation:accommodations!booking_items_pickup_accommodation_id_fkey(name),
        dropoff_accommodation:accommodations!booking_items_dropoff_accommodation_id_fkey(name)
      )`,
    )
    .eq("id", bookingId)
    .single();

  if (!data) return null;

  const customer = data.customers as unknown as {
    full_name: string;
    email: string | null;
    phone: string | null;
    language: string;
  } | null;

  if (!customer) {
    console.error("[reservation-email] booking has no customer:", bookingId);
    return null;
  }

  const items = (data.booking_items ?? []) as unknown as Array<{
    service_date: string;
    bags_count: number;
    overweight_bags_count: number;
    pickup_accommodation: { name: string } | null;
    dropoff_accommodation: { name: string } | null;
  }>;

  return {
    bookingId: data.id,
    bookingCode: data.booking_code,
    serviceDate: data.service_date,
    bookingType: data.booking_type,
    customerName: customer.full_name ?? "—",
    customerFirstName: getCustomerFirstName(customer.full_name ?? ""),
    customerEmail: customer.email ?? null,
    customerPhone: customer.phone ?? "—",
    comments: data.notes_customer ?? "—",
    language: data.language || customer.language || "es",
    totalPrice: Number(data.total_amount) || 0,
    subtotalAmount: Number(data.subtotal_amount) || 0,
    discountAmount: Number(data.discount_amount) || 0,
    extraWeightAmount: Number(data.extra_weight_amount) || 0,
    items: items.map((item) => ({
      serviceDate: item.service_date,
      bagsCount: item.bags_count,
      overweightBagsCount: item.overweight_bags_count,
      pickupName: item.pickup_accommodation?.name ?? "—",
      dropoffName: item.dropoff_accommodation?.name ?? "—",
    })),
  };
}

async function buildReservationPdf(
  context: ReservationEmailContext,
): Promise<EmailAttachment | null> {
  const invoiceData: InvoiceData = {
    bookingCode: context.bookingCode,
    customerName: context.customerName,
    customerEmail: context.customerEmail ?? "—",
    legs: context.items.map((item) => ({
      serviceDate: item.serviceDate,
      pickupName: item.pickupName,
      dropoffName: item.dropoffName,
      bagsCount: item.bagsCount,
      overweightBagsCount: item.overweightBagsCount,
    })),
    subtotalAmount: context.subtotalAmount,
    discountAmount: context.discountAmount,
    extraWeightAmount: context.extraWeightAmount,
    totalAmount: context.totalPrice,
    customerNotes: context.comments === "—" ? null : context.comments,
  };

  const pdfBytes = await generateInvoicePdf(invoiceData);

  return {
    filename: getPdfAttachmentName(context.bookingCode),
    content: pdfBytes,
    contentType: "application/pdf",
  };
}

function buildAdminEmail(context: ReservationEmailContext) {
  const firstItem = context.items[0];
  const bagsCount = context.items.reduce((sum, item) => sum + item.bagsCount, 0);
  const overweightBagsText = getOverweightText(context.items);
  const sentAt = new Date().toLocaleString("gl-ES", { hour12: false });
  const subject = `Nova reserva ${context.bookingCode} · ${context.customerName} · ${formatDate(context.serviceDate)}`;

  const html = `<!DOCTYPE html>
<html lang="gl">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f5f7f6;font-family:Arial,Helvetica,sans-serif;color:#163228;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d8e3dd;border-radius:12px;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:22px;color:#163228;">Nova reserva recibida a traves da web</h1>
    <p style="margin:0 0 16px;line-height:1.7;">🧍 <strong>Nome:</strong> ${escapeHtml(context.customerName)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📞 <strong>Telefono:</strong> ${escapeHtml(context.customerPhone)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📧 <strong>Email:</strong> ${escapeHtml(context.customerEmail ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🎒 <strong>Nº mochilas:</strong> ${bagsCount}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📦 <strong>Mochilas &gt;15 kg:</strong> ${escapeHtml(overweightBagsText)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏠 <strong>Orixe:</strong> ${escapeHtml(firstItem?.pickupName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏡 <strong>Destino:</strong> ${escapeHtml(context.items[context.items.length - 1]?.dropoffName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📅 <strong>Data de servizo:</strong> ${formatDate(context.serviceDate)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">💰 <strong>Prezo total:</strong> ${formatPrice(context.totalPrice)}€</p>
    <p style="margin:0 0 16px;line-height:1.7;">📝 <strong>Comentarios:</strong> ${nl2br(context.comments)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🔐 <strong>Nº reserva:</strong> ${escapeHtml(context.bookingCode)}<br />ID interno: ${escapeHtml(context.bookingId)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📄 <strong>PDF incluido:</strong> O PDF completo da reserva esta adxunto. A estrutura de adxuntos queda preparada para incorporar o PDF loxistico final cando estea dispoñible.</p>
    <p style="margin:0 0 16px;line-height:1.7;">🕒 <strong>Hora de envio:</strong> ${escapeHtml(sentAt)}</p>
    <p style="margin:0;line-height:1.7;">🛠️ <strong>Tipo de reserva:</strong> ${escapeHtml(context.bookingType)}</p>
  </div>
</body>
</html>`;

  return { subject, html };
}

function buildCustomerEmail(context: ReservationEmailContext) {
  const firstItem = context.items[0];
  const bagsCount = context.items.reduce((sum, item) => sum + item.bagsCount, 0);
  const overweightBagsText = getOverweightText(context.items);
  const subject = `Reserva confirmada · Easy Brais · ${context.bookingCode}`;

  const html = `<!DOCTYPE html>
<html lang="gl">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:#163228;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:12px;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:22px;color:#163228;">Ola, ${escapeHtml(context.customerFirstName)} 👋</h1>
    <p style="margin:0 0 18px;line-height:1.7;">A tua reserva con Easy Brais xa esta rexistrada correctamente.</p>
    <p style="margin:0 0 16px;line-height:1.7;">🔐 <strong>Nº reserva:</strong> ${escapeHtml(context.bookingCode)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📅 <strong>Data de servizo:</strong> ${formatDate(context.serviceDate)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🎒 <strong>Nº mochilas:</strong> ${bagsCount}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📦 <strong>Mochilas &gt;15 kg:</strong> ${escapeHtml(overweightBagsText)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏠 <strong>Recollida:</strong> ${escapeHtml(firstItem?.pickupName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏡 <strong>Entrega:</strong> ${escapeHtml(context.items[context.items.length - 1]?.dropoffName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">💰 <strong>Prezo total:</strong> ${formatPrice(context.totalPrice)}€</p>
    <p style="margin:0 0 16px;line-height:1.7;">📝 <strong>Comentarios:</strong><br />${nl2br(context.comments)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">Non tes que facer nada mais. Nos encargamonos de transportar a tua equipaxe ata o destino indicado.</p>
    <p style="margin:0 0 16px;line-height:1.7;">Garda este correo e o PDF adxunto como xustificante da reserva.</p>
    <p style="margin:0 0 16px;line-height:1.7;">Se detectas algun erro ou necesitas modificar algun dato, responde directamente a este correo e revisamolo contigo.</p>
    <p style="margin:0;line-height:1.7;">Bo Camiño!<br /><br />Easy Brais<br />Transporte de mochilas no Camiño Portugues</p>
  </div>
</body>
</html>`;

  return { subject, html };
}

function classifyEmailStatus(input: { sent: boolean; error?: string }): "sent" | "failed" | "pending" {
  if (input.sent) return "sent";
  // SMTP no configurado en dev/test: marcamos como `pending` para no inflar fallos
  if (input.error === "SMTP not configured") return "pending";
  return "failed";
}

async function insertEmailLog(
  supabase: SupabaseAdmin,
  input: {
    bookingId: string;
    recipient: string;
    subject: string;
    template: string;
    sent: boolean;
    messageId?: string;
    error?: string;
  },
) {
  const status = classifyEmailStatus(input);

  const payload = {
    booking_id: input.bookingId,
    recipient: input.recipient,
    subject: input.subject,
    template: input.template,
    template_key: input.template,
    status,
    provider: EMAIL_PROVIDER,
    external_message_id: input.messageId ?? null,
    error_message: input.error ?? null,
    sent_at: input.sent ? new Date().toISOString() : null,
  };

  try {
    await supabase.from("email_logs").insert(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[reservation-email] email_logs insert failed:", message);
  }
}

async function insertEmailEvent(
  supabase: SupabaseAdmin,
  input: {
    bookingId: string;
    recipient: string;
    template: string;
    sent: boolean;
    messageId?: string;
    error?: string;
  },
) {
  try {
    await supabase.from("booking_events").insert({
      booking_id: input.bookingId,
      event_type: "email_sent" as const,
      actor_type: "system" as const,
      payload_json: {
        template: input.template,
        recipient: input.recipient,
        provider: EMAIL_PROVIDER,
        sent: input.sent,
        message_id: input.messageId ?? null,
        error: input.error ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[reservation-email] booking_events insert failed:", message);
  }
}

async function updateBookingEmailStatus(
  supabase: SupabaseAdmin,
  bookingId: string,
  status: "sent" | "failed" | "not_sent",
) {
  try {
    await supabase.from("bookings").update({ email_status: status }).eq("id", bookingId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[reservation-email] booking email_status update failed:", message);
  }
}

export async function sendAdminNewReservationEmail(
  bookingId: string,
  supabase = createAdminClient(),
): Promise<{ sent: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return { sent: false, error: "ADMIN_EMAIL not configured" };
  }

  const context = await getReservationEmailContext(supabase, bookingId);
  if (!context) {
    return { sent: false, error: "Reservation not found" };
  }

  const { subject, html } = buildAdminEmail(context);

  let attachments: EmailAttachment[] | undefined;
  try {
    const pdf = await buildReservationPdf(context);
    attachments = pdf ? [pdf] : undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[reservation-email] admin PDF generation failed:", message);
  }

  const result = await sendEmail({
    to: adminEmail,
    subject,
    html,
    attachments,
  });

  await insertEmailLog(supabase, {
    bookingId,
    recipient: adminEmail,
    subject,
    template: ADMIN_TEMPLATE,
    sent: result.sent,
    messageId: result.messageId,
    error: result.error,
  });

  await insertEmailEvent(supabase, {
    bookingId,
    recipient: adminEmail,
    template: ADMIN_TEMPLATE,
    sent: result.sent,
    messageId: result.messageId,
    error: result.error,
  });

  return result;
}

export async function sendCustomerReservationConfirmationEmail(
  bookingId: string,
  supabase = createAdminClient(),
): Promise<{ sent: boolean; error?: string }> {
  const context = await getReservationEmailContext(supabase, bookingId);
  if (!context) {
    return { sent: false, error: "Reservation not found" };
  }

  if (!context.customerEmail) {
    await updateBookingEmailStatus(supabase, bookingId, "failed");
    return { sent: false, error: "Customer email missing" };
  }

  const { subject, html } = buildCustomerEmail(context);
  let attachments: EmailAttachment[] | undefined;
  try {
    const pdf = await buildReservationPdf(context);
    attachments = pdf ? [pdf] : undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[reservation-email] customer PDF generation failed:", message);
  }

  const result = await sendEmail({
    to: context.customerEmail,
    subject,
    html,
    attachments,
  });

  await insertEmailLog(supabase, {
    bookingId,
    recipient: context.customerEmail,
    subject,
    template: CUSTOMER_TEMPLATE,
    sent: result.sent,
    messageId: result.messageId,
    error: result.error,
  });

  await insertEmailEvent(supabase, {
    bookingId,
    recipient: context.customerEmail,
    template: CUSTOMER_TEMPLATE,
    sent: result.sent,
    messageId: result.messageId,
    error: result.error,
  });

  await updateBookingEmailStatus(
    supabase,
    bookingId,
    result.sent ? "sent" : result.error === "SMTP not configured" ? "not_sent" : "failed",
  );

  return result;
}

export async function sendReservationEmails(
  bookingId: string,
  supabase = createAdminClient(),
): Promise<{
  admin: { sent: boolean; error?: string };
  customer: { sent: boolean; error?: string };
}> {
  const cfg = getSmtpConfig();
  if (!cfg) {
    console.error(
      "[reservation-email] SMTP no configurado (faltan SMTP_HOST, SMTP_USER y/o SMTP_PASS). Ningún correo se enviará.",
    );
  } else {
    console.log("[reservation-email] SMTP listo:", { host: cfg.host, port: cfg.port, from: cfg.fromEmail });
  }

  /* Cliente primero: si hay timeout en Vercel, priorizamos el correo al peregrino. */
  const customerResult = await sendCustomerReservationConfirmationEmail(bookingId, supabase);
  const adminResult = await sendAdminNewReservationEmail(bookingId, supabase);

  if (!customerResult.sent) {
    console.error("[reservation-email] customer send failed:", customerResult.error ?? "unknown");
  }
  if (!adminResult.sent) {
    console.error("[reservation-email] admin send failed:", adminResult.error ?? "unknown");
  }

  return { admin: adminResult, customer: customerResult };
}

// ---------------------------------------------------------------------------
// Confirmación de pago (Stripe completed)
// ---------------------------------------------------------------------------

function buildPaymentConfirmedEmail(context: ReservationEmailContext) {
  const subject = `Pago recibido · Reserva ${context.bookingCode} confirmada · Easy Brais`;
  const firstItem = context.items[0];
  const lastItem = context.items[context.items.length - 1];

  const html = `<!DOCTYPE html>
<html lang="gl">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:#163228;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:12px;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:22px;color:#163228;">Pago recibido ✅</h1>
    <p style="margin:0 0 18px;line-height:1.7;">Ola ${escapeHtml(context.customerFirstName)}, recibimos correctamente o teu pago. A tua reserva queda <strong>confirmada</strong>.</p>
    <p style="margin:0 0 16px;line-height:1.7;">🔐 <strong>Nº reserva:</strong> ${escapeHtml(context.bookingCode)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📅 <strong>Data de servizo:</strong> ${formatDate(context.serviceDate)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏠 <strong>Recollida:</strong> ${escapeHtml(firstItem?.pickupName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏡 <strong>Entrega:</strong> ${escapeHtml(lastItem?.dropoffName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">💰 <strong>Importe pagado:</strong> ${formatPrice(context.totalPrice)}€</p>
    <p style="margin:0 0 16px;line-height:1.7;">Adxuntámosche o PDF da reserva como xustificante.</p>
    <p style="margin:0;line-height:1.7;">Bo Camiño!<br /><br />Easy Brais<br />Transporte de mochilas no Camiño Portugues</p>
  </div>
</body>
</html>`;

  return { subject, html };
}

export async function sendPaymentConfirmedEmail(
  bookingId: string,
  supabase = createAdminClient(),
): Promise<{ sent: boolean; error?: string }> {
  const context = await getReservationEmailContext(supabase, bookingId);
  if (!context) {
    return { sent: false, error: "Reservation not found" };
  }

  if (!context.customerEmail) {
    return { sent: false, error: "Customer email missing" };
  }

  const { subject, html } = buildPaymentConfirmedEmail(context);

  let attachments: EmailAttachment[] | undefined;
  try {
    const pdf = await buildReservationPdf(context);
    attachments = pdf ? [pdf] : undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[reservation-email] payment PDF generation failed:", message);
  }

  const result = await sendEmail({
    to: context.customerEmail,
    subject,
    html,
    attachments,
  });

  await insertEmailLog(supabase, {
    bookingId,
    recipient: context.customerEmail,
    subject,
    template: CUSTOMER_PAYMENT_TEMPLATE,
    sent: result.sent,
    messageId: result.messageId,
    error: result.error,
  });

  await insertEmailEvent(supabase, {
    bookingId,
    recipient: context.customerEmail,
    template: CUSTOMER_PAYMENT_TEMPLATE,
    sent: result.sent,
    messageId: result.messageId,
    error: result.error,
  });

  return result;
}
