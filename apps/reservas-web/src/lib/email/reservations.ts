import "server-only";

import { createAdminClient } from "@easybrais/utils/supabase/admin";
import { generateInvoicePdf, type InvoiceData } from "@easybrais/utils/pdf";
import { getSmtpConfig, sendEmail, type EmailAttachment } from "@easybrais/utils/email";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/translations";
import { buildWhatsAppHref } from "@/lib/phone";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

const EMAIL_PROVIDER = "brevo_smtp";
const ADMIN_TEMPLATE = "admin_new_reservation";
const CUSTOMER_TEMPLATE = "customer_reservation_confirmation";
const CUSTOMER_PAYMENT_TEMPLATE = "customer_payment_confirmed";
const CUSTOMER_INCIDENT_TEMPLATE = "customer_incident_reported";
const EASYBRAIS_WHATSAPP = "+34 603 327 708";

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

function resolveLocale(value: string | null | undefined): Locale {
  const normalized = value?.trim().toLowerCase() as Locale | undefined;
  return normalized && SUPPORTED_LOCALES.includes(normalized) ? normalized : "es";
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

function getCustomerEmailCopy(locale: Locale) {
  const copy = {
    es: {
      subjectConfirmed: "Reserva confirmada",
      subjectPaid: "Pago recibido",
      greeting: "Hola",
      confirmedIntro: "Tu reserva con Easy Brais ya está confirmada correctamente.",
      paidIntro: "Hemos recibido correctamente tu pago. Tu reserva queda confirmada.",
      bookingCode: "Nº reserva",
      serviceDate: "Fecha del servicio",
      bags: "Nº mochilas",
      overweight: "Mochilas >15 kg",
      pickup: "Recogida",
      dropoff: "Entrega",
      totalPrice: "Precio total",
      paidAmount: "Importe pagado",
      notes: "Comentarios",
      noMoreSteps: "No tienes que hacer nada más. Nosotros nos encargamos de transportar tu equipaje hasta el destino indicado.",
      saveEmail: "Guarda este correo y el PDF adjunto como justificante de la reserva.",
      reviewData: "Si detectas algun error o necesitas modificar algun dato, escribenos por WhatsApp y lo revisamos contigo.",
      attachedPdf: "Te adjuntamos el PDF de la reserva como justificante.",
      farewell: "Buen Camino",
      footer: "Transporte de mochilas en el Camino Portugués",
    },
    en: {
      subjectConfirmed: "Booking confirmed",
      subjectPaid: "Payment received",
      greeting: "Hello",
      confirmedIntro: "Your booking with Easy Brais has been confirmed successfully.",
      paidIntro: "We have received your payment successfully. Your booking is now confirmed.",
      bookingCode: "Booking code",
      serviceDate: "Service date",
      bags: "Number of bags",
      overweight: "Bags over 15 kg",
      pickup: "Pickup",
      dropoff: "Drop-off",
      totalPrice: "Total price",
      paidAmount: "Amount paid",
      notes: "Notes",
      noMoreSteps: "You do not need to do anything else. We will transport your luggage to the selected destination.",
      saveEmail: "Keep this email and the attached PDF as your booking confirmation.",
      reviewData: "If you spot any mistake or need to change any detail, send us a WhatsApp message and we will review it with you.",
      attachedPdf: "We have attached the booking PDF as your receipt.",
      farewell: "Buen Camino",
      footer: "Luggage transport on the Portuguese Way",
    },
    pt: {
      subjectConfirmed: "Reserva confirmada",
      subjectPaid: "Pagamento recebido",
      greeting: "Olá",
      confirmedIntro: "A sua reserva com a Easy Brais ficou confirmada com sucesso.",
      paidIntro: "Recebemos o seu pagamento com sucesso. A sua reserva fica agora confirmada.",
      bookingCode: "Nº da reserva",
      serviceDate: "Data do serviço",
      bags: "Nº de mochilas",
      overweight: "Mochilas >15 kg",
      pickup: "Recolha",
      dropoff: "Entrega",
      totalPrice: "Preço total",
      paidAmount: "Valor pago",
      notes: "Observações",
      noMoreSteps: "Não precisa de fazer mais nada. Nós tratamos do transporte da sua bagagem até ao destino indicado.",
      saveEmail: "Guarde este email e o PDF em anexo como comprovativo da reserva.",
      reviewData: "Se detetar algum erro ou precisar de alterar algum dado, envie-nos uma mensagem por WhatsApp e revemos consigo.",
      attachedPdf: "Enviamos em anexo o PDF da reserva como comprovativo.",
      farewell: "Bom Caminho",
      footer: "Transporte de mochilas no Caminho Português",
    },
    fr: {
      subjectConfirmed: "Réservation confirmée",
      subjectPaid: "Paiement reçu",
      greeting: "Bonjour",
      confirmedIntro: "Votre réservation avec Easy Brais est bien confirmée.",
      paidIntro: "Nous avons bien reçu votre paiement. Votre réservation est maintenant confirmée.",
      bookingCode: "Nº de réservation",
      serviceDate: "Date du service",
      bags: "Nombre de bagages",
      overweight: "Bagages >15 kg",
      pickup: "Prise en charge",
      dropoff: "Livraison",
      totalPrice: "Prix total",
      paidAmount: "Montant payé",
      notes: "Observations",
      noMoreSteps: "Vous n'avez rien d'autre à faire. Nous nous chargeons de transporter vos bagages jusqu'à la destination indiquée.",
      saveEmail: "Conservez cet email et le PDF joint comme justificatif de réservation.",
      reviewData: "Si vous reperez une erreur ou devez modifier une information, ecrivez-nous sur WhatsApp et nous la verifierons avec vous.",
      attachedPdf: "Le PDF de la réservation est joint à cet email comme justificatif.",
      farewell: "Bon Chemin",
      footer: "Transport de bagages sur le Chemin Portugais",
    },
    de: {
      subjectConfirmed: "Buchung bestätigt",
      subjectPaid: "Zahlung erhalten",
      greeting: "Hallo",
      confirmedIntro: "Ihre Buchung bei Easy Brais wurde erfolgreich bestätigt.",
      paidIntro: "Wir haben Ihre Zahlung erfolgreich erhalten. Ihre Buchung ist nun bestätigt.",
      bookingCode: "Buchungscode",
      serviceDate: "Servicedatum",
      bags: "Anzahl Gepäckstücke",
      overweight: "Gepäckstücke >15 kg",
      pickup: "Abholung",
      dropoff: "Lieferung",
      totalPrice: "Gesamtpreis",
      paidAmount: "Bezahlter Betrag",
      notes: "Hinweise",
      noMoreSteps: "Sie müssen nichts weiter tun. Wir kümmern uns um den Transport Ihres Gepäcks zum angegebenen Ziel.",
      saveEmail: "Bewahren Sie diese E-Mail und das beigefügte PDF als Buchungsbestätigung auf.",
      reviewData: "Wenn Ihnen ein Fehler auffallt oder Sie Angaben andern mussen, schreiben Sie uns per WhatsApp und wir prufen es mit Ihnen.",
      attachedPdf: "Das PDF der Buchung ist als Beleg beigefügt.",
      farewell: "Buen Camino",
      footer: "Gepäcktransport auf dem Portugiesischen Weg",
    },
    it: {
      subjectConfirmed: "Prenotazione confermata",
      subjectPaid: "Pagamento ricevuto",
      greeting: "Ciao",
      confirmedIntro: "La tua prenotazione con Easy Brais è stata confermata correttamente.",
      paidIntro: "Abbiamo ricevuto correttamente il tuo pagamento. La tua prenotazione è ora confermata.",
      bookingCode: "Codice prenotazione",
      serviceDate: "Data del servizio",
      bags: "Nº bagagli",
      overweight: "Bagagli >15 kg",
      pickup: "Ritiro",
      dropoff: "Consegna",
      totalPrice: "Prezzo totale",
      paidAmount: "Importo pagato",
      notes: "Note",
      noMoreSteps: "Non devi fare altro. Ci occupiamo noi di trasportare il tuo bagaglio fino alla destinazione indicata.",
      saveEmail: "Conserva questa email e il PDF allegato come conferma della prenotazione.",
      reviewData: "Se noti un errore o hai bisogno di modificare qualche dato, scrivici su WhatsApp e lo controlleremo con te.",
      attachedPdf: "Ti alleghiamo il PDF della prenotazione come ricevuta.",
      farewell: "Buen Camino",
      footer: "Trasporto bagagli sul Cammino Portoghese",
    },
  } as const;

  return copy[locale];
}

function getIncidentEmailCopy(locale: Locale) {
  const copy = {
    es: {
      subject: "Incidencia en tu reserva",
      title: "Hemos detectado una incidencia en tu reserva",
      intro: "Queremos avisarte cuanto antes para que tengas toda la información actualizada sobre tu servicio.",
      incidentLabel: "Detalle de la incidencia",
      supportText: "Nuestro equipo ya la está revisando y, si es necesario, te contactará con una actualización o una propuesta de solución lo antes posible.",
      contactText: "Si necesitas añadir información importante, responde directamente a este correo indicando tu número de reserva.",
      close: "Gracias por tu comprensión.",
    },
    en: {
      subject: "Issue reported on your booking",
      title: "We have detected an issue with your booking",
      intro: "We want to let you know as soon as possible so you have the latest information about your service.",
      incidentLabel: "Issue details",
      supportText: "Our team is already reviewing it and, if needed, will contact you with an update or proposed solution as soon as possible.",
      contactText: "If you need to add important information, reply directly to this email and include your booking code.",
      close: "Thank you for your understanding.",
    },
    pt: {
      subject: "Incidência na sua reserva",
      title: "Detetámos uma incidência na sua reserva",
      intro: "Queremos avisá-lo o mais cedo possível para que tenha a informação mais atualizada sobre o seu serviço.",
      incidentLabel: "Detalhe da incidência",
      supportText: "A nossa equipa já está a rever a situação e, se necessário, entrará em contacto consigo com uma atualização ou proposta de solução o mais rapidamente possível.",
      contactText: "Se precisar de acrescentar alguma informação importante, responda diretamente a este email indicando o número da reserva.",
      close: "Obrigado pela sua compreensão.",
    },
    fr: {
      subject: "Incident sur votre réservation",
      title: "Nous avons détecté un incident sur votre réservation",
      intro: "Nous souhaitons vous prévenir le plus tôt possible afin que vous disposiez des informations les plus récentes concernant votre service.",
      incidentLabel: "Détail de l'incident",
      supportText: "Notre équipe l'examine déjà et, si nécessaire, vous contactera rapidement avec une mise à jour ou une proposition de solution.",
      contactText: "Si vous devez ajouter une information importante, répondez directement à cet email en indiquant votre numéro de réservation.",
      close: "Merci pour votre compréhension.",
    },
    de: {
      subject: "Vorfall zu Ihrer Buchung",
      title: "Wir haben einen Vorfall zu Ihrer Buchung festgestellt",
      intro: "Wir möchten Sie so früh wie möglich informieren, damit Sie den aktuellen Stand zu Ihrem Service kennen.",
      incidentLabel: "Details zum Vorfall",
      supportText: "Unser Team prüft den Fall bereits und wird Sie bei Bedarf so schnell wie möglich mit einem Update oder Lösungsvorschlag kontaktieren.",
      contactText: "Wenn Sie wichtige zusätzliche Informationen haben, antworten Sie direkt auf diese E-Mail und geben Sie Ihren Buchungscode an.",
      close: "Vielen Dank für Ihr Verständnis.",
    },
    it: {
      subject: "Problema nella tua prenotazione",
      title: "Abbiamo rilevato un problema nella tua prenotazione",
      intro: "Vogliamo avvisarti il prima possibile così avrai le informazioni più aggiornate sul tuo servizio.",
      incidentLabel: "Dettaglio del problema",
      supportText: "Il nostro team sta già verificando la situazione e, se necessario, ti contatterà al più presto con un aggiornamento o una proposta di soluzione.",
      contactText: "Se devi aggiungere informazioni importanti, rispondi direttamente a questa email indicando il numero di prenotazione.",
      close: "Grazie per la comprensione.",
    },
  } as const;

  return copy[locale];
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
  const locale = resolveLocale(context.language);
  const copy = getCustomerEmailCopy(locale);
  const firstItem = context.items[0];
  const bagsCount = context.items.reduce((sum, item) => sum + item.bagsCount, 0);
  const overweightBagsText = getOverweightText(context.items);
  const subject = `${copy.subjectConfirmed} · Easy Brais · ${context.bookingCode}`;
  const whatsappHref = buildWhatsAppHref(EASYBRAIS_WHATSAPP);

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:#163228;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:12px;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:22px;color:#163228;">${copy.greeting}, ${escapeHtml(context.customerFirstName)} 👋</h1>
    <p style="margin:0 0 18px;line-height:1.7;">${copy.confirmedIntro}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🔐 <strong>${copy.bookingCode}:</strong> ${escapeHtml(context.bookingCode)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📅 <strong>${copy.serviceDate}:</strong> ${formatDate(context.serviceDate)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🎒 <strong>${copy.bags}:</strong> ${bagsCount}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📦 <strong>${copy.overweight}:</strong> ${escapeHtml(overweightBagsText)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏠 <strong>${copy.pickup}:</strong> ${escapeHtml(firstItem?.pickupName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏡 <strong>${copy.dropoff}:</strong> ${escapeHtml(context.items[context.items.length - 1]?.dropoffName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">💰 <strong>${copy.totalPrice}:</strong> ${formatPrice(context.totalPrice)}€</p>
    <p style="margin:0 0 16px;line-height:1.7;">📝 <strong>${copy.notes}:</strong><br />${nl2br(context.comments)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">${copy.noMoreSteps}</p>
    <p style="margin:0 0 16px;line-height:1.7;">${copy.saveEmail}</p>
    <p style="margin:0 0 16px;line-height:1.7;">${copy.reviewData}</p>
    ${whatsappHref
      ? `<p style="margin:0 0 16px;line-height:1.7;"><strong>WhatsApp Easy Brais:</strong> <a href="${escapeHtml(whatsappHref)}" style="color:#166534;text-decoration:none;">${escapeHtml(EASYBRAIS_WHATSAPP)}</a></p>`
      : ""}
    <p style="margin:0;line-height:1.7;">${copy.farewell}!<br /><br />Easy Brais<br />${copy.footer}</p>
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
  const locale = resolveLocale(context.language);
  const copy = getCustomerEmailCopy(locale);
  const subject = `${copy.subjectPaid} · ${copy.bookingCode} ${context.bookingCode} · Easy Brais`;
  const firstItem = context.items[0];
  const lastItem = context.items[context.items.length - 1];

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:#163228;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:12px;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:22px;color:#163228;">${copy.subjectPaid} ✅</h1>
    <p style="margin:0 0 18px;line-height:1.7;">${copy.greeting} ${escapeHtml(context.customerFirstName)}, ${copy.paidIntro}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🔐 <strong>${copy.bookingCode}:</strong> ${escapeHtml(context.bookingCode)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📅 <strong>${copy.serviceDate}:</strong> ${formatDate(context.serviceDate)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏠 <strong>${copy.pickup}:</strong> ${escapeHtml(firstItem?.pickupName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏡 <strong>${copy.dropoff}:</strong> ${escapeHtml(lastItem?.dropoffName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">💰 <strong>${copy.paidAmount}:</strong> ${formatPrice(context.totalPrice)}€</p>
    <p style="margin:0 0 16px;line-height:1.7;">${copy.attachedPdf}</p>
    <p style="margin:0;line-height:1.7;">${copy.farewell}!<br /><br />Easy Brais<br />${copy.footer}</p>
  </div>
</body>
</html>`;

  return { subject, html };
}

function buildIncidentReportedEmail(
  context: ReservationEmailContext,
  incidentMessage: string,
) {
  const locale = resolveLocale(context.language);
  const copy = getIncidentEmailCopy(locale);
  const smtpConfig = getSmtpConfig();
  const incidentContactEmail = smtpConfig?.replyTo ?? smtpConfig?.fromEmail ?? null;
  const firstItem = context.items[0];
  const lastItem = context.items[context.items.length - 1];
  const subject = `${copy.subject} · ${context.bookingCode} · Easy Brais`;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:#163228;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:12px;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:22px;color:#163228;">${copy.title}</h1>
    <p style="margin:0 0 18px;line-height:1.7;">${copy.intro}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🔐 <strong>${getCustomerEmailCopy(locale).bookingCode}:</strong> ${escapeHtml(context.bookingCode)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">📅 <strong>${getCustomerEmailCopy(locale).serviceDate}:</strong> ${formatDate(context.serviceDate)}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏠 <strong>${getCustomerEmailCopy(locale).pickup}:</strong> ${escapeHtml(firstItem?.pickupName ?? "—")}</p>
    <p style="margin:0 0 16px;line-height:1.7;">🏡 <strong>${getCustomerEmailCopy(locale).dropoff}:</strong> ${escapeHtml(lastItem?.dropoffName ?? "—")}</p>
    <div style="margin:0 0 18px;border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:16px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#b91c1c;">${copy.incidentLabel}</p>
      <p style="margin:0;line-height:1.7;color:#7f1d1d;">${nl2br(incidentMessage)}</p>
    </div>
    <p style="margin:0 0 16px;line-height:1.7;">${copy.supportText}</p>
    <p style="margin:0 0 16px;line-height:1.7;">${copy.contactText}</p>
    ${incidentContactEmail
      ? `<p style="margin:0 0 16px;line-height:1.7;"><strong>Email:</strong> <a href="mailto:${escapeHtml(incidentContactEmail)}" style="color:#166534;text-decoration:none;">${escapeHtml(incidentContactEmail)}</a></p>`
      : ""}
    <p style="margin:0;line-height:1.7;">${copy.close}<br /><br />Easy Brais<br />${getCustomerEmailCopy(locale).footer}</p>
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

export async function sendCustomerIncidentReportedEmail(
  bookingId: string,
  incidentMessage: string,
  supabase = createAdminClient(),
): Promise<{ sent: boolean; error?: string }> {
  const context = await getReservationEmailContext(supabase, bookingId);
  if (!context) {
    return { sent: false, error: "Reservation not found" };
  }

  if (!context.customerEmail) {
    return { sent: false, error: "Customer email missing" };
  }

  const { subject, html } = buildIncidentReportedEmail(context, incidentMessage.trim());

  const result = await sendEmail({
    to: context.customerEmail,
    subject,
    html,
  });

  await insertEmailLog(supabase, {
    bookingId,
    recipient: context.customerEmail,
    subject,
    template: CUSTOMER_INCIDENT_TEMPLATE,
    sent: result.sent,
    messageId: result.messageId,
    error: result.error,
  });

  await insertEmailEvent(supabase, {
    bookingId,
    recipient: context.customerEmail,
    template: CUSTOMER_INCIDENT_TEMPLATE,
    sent: result.sent,
    messageId: result.messageId,
    error: result.error,
  });

  return result;
}
