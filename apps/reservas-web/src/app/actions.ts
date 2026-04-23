"use server";

import { createAdminClient, calculatePricing, getRealEtapas, resolvePerBagPrice, type PricingBreakdown } from "@easybrais/utils";
import {
  sendEmail,
  bookingConfirmationSubject,
  bookingConfirmationHtml,
  type BookingConfirmationData,
} from "@easybrais/utils/email";
import { generateInvoicePdf, type InvoiceData } from "@easybrais/utils/pdf";
import type { BookingFormData } from "@/lib/types";
import { isStripeConfigured } from "@/lib/stripe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookingSuccess {
  ok: true;
  bookingId: string;
  bookingCode: string;
  customerName: string;
  email: string;
  legsCount: number;
  firstServiceDate: string;
  pricing: PricingBreakdown;
  stripeEnabled: boolean;
}

export interface BookingFailure {
  ok: false;
  error: string;
}

export type CreateBookingResult = BookingSuccess | BookingFailure;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateBookingCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `EB-${yy}${mm}${dd}-${rand}`;
}

function fail(msg: string): BookingFailure {
  return { ok: false, error: msg };
}

// ---------------------------------------------------------------------------
// Main action
// ---------------------------------------------------------------------------

export async function createBooking(
  data: BookingFormData,
  idempotencyKey: string,
): Promise<CreateBookingResult> {
  /* ── Server-side validation ──────────────────────────────────────────── */

  if (!data.customer.fullName?.trim()) return fail("El nombre es obligatorio.");
  if (data.customer.fullName.length > 120) return fail("El nombre es demasiado largo.");
  if (!data.customer.email?.trim()) return fail("El email es obligatorio.");
  if (data.customer.email.length > 254) return fail("El email es demasiado largo.");
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(data.customer.email))
    return fail("El email no es válido.");
  if (data.customer.phone && data.customer.phone.length > 30)
    return fail("El teléfono es demasiado largo.");
  if (data.customer.notes && data.customer.notes.length > 500)
    return fail("Las observaciones son demasiado largas.");
  if (!data.legs.length) return fail("Debes añadir al menos un tramo.");

  for (const [i, leg] of data.legs.entries()) {
    if (!leg.serviceDate)
      return fail(`Tramo ${i + 1}: falta la fecha de servicio.`);
    if (!leg.pickupAccommodationId)
      return fail(`Tramo ${i + 1}: falta el alojamiento de recogida.`);
    if (!leg.dropoffAccommodationId)
      return fail(`Tramo ${i + 1}: falta el alojamiento de entrega.`);
    if (leg.pickupAccommodationId === leg.dropoffAccommodationId)
      return fail(`Tramo ${i + 1}: recogida y entrega deben ser distintos.`);
    if (leg.bagsCount < 1)
      return fail(`Tramo ${i + 1}: mínimo 1 mochila.`);
  }

  if (!idempotencyKey?.trim()) return fail("Solicitud inválida.");

  try {
    const supabase = createAdminClient();

    /* ── Resolve stage distances for pricing ─────────────────────────── */

    const allAccIds = data.legs.flatMap((l) => [l.pickupAccommodationId, l.dropoffAccommodationId]);
    const uniqueAccIds = [...new Set(allAccIds)];

    const { data: accRows } = await supabase
      .from("accommodations")
      .select("id, external_code")
      .in("id", uniqueAccIds);

    type AccRow = { id: string; external_code: string | null };
    const accLookup = new Map((accRows ?? []).map((a: AccRow) => [a.id, a]));

    function stageNumber(code: string | null): number | null {
      if (!code) return null;
      const n = parseInt(code.split(".")[0], 10);
      return Number.isNaN(n) ? null : n;
    }

    function getLegPrefixes(pickupId: string, dropoffId: string) {
      const p = stageNumber(accLookup.get(pickupId)?.external_code ?? null);
      const d = stageNumber(accLookup.get(dropoffId)?.external_code ?? null);
      const etapas = p !== null && d !== null ? getRealEtapas(p, d) : 1;
      return { pickupPrefix: p, dropoffPrefix: d, stagesCount: etapas };
    }

    const pricing = calculatePricing(
      data.legs.map((l) => {
        const { pickupPrefix, dropoffPrefix, stagesCount } = getLegPrefixes(l.pickupAccommodationId, l.dropoffAccommodationId);
        return {
          bagsCount: l.bagsCount,
          overweightBagsCount: l.overweightBagsCount,
          stagesCount,
          pickupPrefix,
          dropoffPrefix,
        };
      }),
    );

    /* ── Idempotency check ───────────────────────────────────────────── */

    const tag = `idem:${idempotencyKey}`;

    const { data: existing, error: idemErr } = await supabase
      .from("bookings")
      .select("id, booking_code")
      .eq("notes_internal", tag)
      .maybeSingle();

    if (idemErr) {
      console.error("[createBooking] idempotency check failed:", idemErr.message);
    }

    if (existing) {
      return {
        ok: true,
        bookingId: existing.id,
        bookingCode: existing.booking_code,
        customerName: data.customer.fullName,
        email: data.customer.email,
        legsCount: data.legs.length,
        firstServiceDate: data.legs[0]?.serviceDate ?? "",
        pricing,
        stripeEnabled: isStripeConfigured(),
      };
    }

    /* ── 1. Find or create customer ────────────────────────────────── */

    const email = data.customer.email.trim().toLowerCase();

    let { data: customer, error: custFindErr } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (custFindErr) {
      console.error("[createBooking] customer lookup failed:", custFindErr.message);
    }

    if (!customer) {
      const { data: created, error } = await supabase
        .from("customers")
        .insert({
          full_name: data.customer.fullName.trim(),
          email,
          phone: data.customer.phone.trim() || null,
          language: data.customer.language || "es",
          notes: data.customer.notes.trim() || null,
        })
        .select("id")
        .single();

      if (error || !created) {
        console.error("[createBooking] customer insert failed:", error?.message);
        return fail("Error al registrar tus datos. Inténtalo de nuevo.");
      }
      customer = created;
    } else {
      const { error: updateErr } = await supabase
        .from("customers")
        .update({
          full_name: data.customer.fullName.trim(),
          phone: data.customer.phone.trim() || null,
          language: data.customer.language || "es",
        })
        .eq("id", customer.id);

      if (updateErr) {
        console.error("[createBooking] customer update failed:", updateErr.message);
      }
    }

    /* ── 2. Generate collision-safe booking code ───────────────────── */

    let bookingCode = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateBookingCode();
      const { data: clash } = await supabase
        .from("bookings")
        .select("id")
        .eq("booking_code", candidate)
        .maybeSingle();
      if (!clash) {
        bookingCode = candidate;
        break;
      }
    }
    if (!bookingCode) return fail("No se pudo generar un código de reserva. Inténtalo de nuevo.");

    /* ── 3. Create booking ───────────────────────────────────────────── */

    const firstDate = data.legs.reduce(
      (min, l) => (l.serviceDate < min ? l.serviceDate : min),
      data.legs[0]?.serviceDate ?? "",
    );

    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        customer_id: customer.id,
        booking_type: "luggage_transfer" as const,
        service_date: firstDate,
        status: "pending" as const,
        source_channel: "web" as const,
        language: data.customer.language || "es",
        notes_customer: data.customer.notes.trim() || null,
        notes_internal: tag,
        subtotal_amount: pricing.subtotalAmount,
        discount_amount: pricing.discountAmount,
        extra_weight_amount: pricing.extraWeightAmount,
        total_amount: pricing.totalAmount,
      })
      .select("id")
      .single();

    if (bookErr || !booking) {
      console.error("[createBooking] booking insert failed:", bookErr?.message);
      return fail("Error al crear la reserva. Inténtalo de nuevo.");
    }

    /* ── 4. Create booking items ──────────────────────────────────── */

    const items = data.legs.map((leg) => {
      const { pickupPrefix, dropoffPrefix, stagesCount } = getLegPrefixes(leg.pickupAccommodationId, leg.dropoffAccommodationId);
      const perBag = resolvePerBagPrice(pickupPrefix, dropoffPrefix, stagesCount);
      return {
        booking_id: booking.id,
        service_date: leg.serviceDate,
        pickup_accommodation_id: leg.pickupAccommodationId,
        dropoff_accommodation_id: leg.dropoffAccommodationId,
        bags_count: leg.bagsCount,
        overweight_bags_count: leg.overweightBagsCount,
        unit_price: perBag,
        line_total: leg.bagsCount * perBag,
        operational_status: "pending" as const,
      };
    });

    const { error: itemsErr } = await supabase.from("booking_items").insert(items);

    if (itemsErr) {
      console.error("[createBooking] items insert failed:", itemsErr.message);
      await supabase.from("bookings").delete().eq("id", booking.id);
      return fail("Error al guardar los tramos. Inténtalo de nuevo.");
    }

    /* ── 5. Log creation event ───────────────────────────────────── */

    const { error: eventErr } = await supabase.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "created" as const,
      actor_type: "customer" as const,
      payload_json: {
        source: "web_form",
        booking_type_form: data.bookingType,
        legs_count: data.legs.length,
        total_bags: pricing.totalBags,
        subtotal: pricing.subtotalAmount,
        discount: pricing.discountAmount,
        extra_weight: pricing.extraWeightAmount,
        total: pricing.totalAmount,
      },
    });

    if (eventErr) {
      console.error("[createBooking] event insert failed:", eventErr.message);
    }

    /* ── 6. Determine payment flow ─────────────────────────────────── */

    const stripeEnabled = isStripeConfigured();
    const wantsOnline = data.paymentMethod !== "cash" && stripeEnabled;

    if (data.paymentMethod === "cash") {
      await supabase
        .from("bookings")
        .update({ payment_method: "cash" } as any)
        .eq("id", booking.id);
    }

    /* ── 7. Send confirmation email (only if no Stripe redirect — otherwise webhook handles it) */

    if (!wantsOnline) {
      sendConfirmationEmail(supabase, booking.id, bookingCode, email, data, pricing).catch(() => {});
    }

    return {
      ok: true,
      bookingId: booking.id,
      bookingCode,
      customerName: data.customer.fullName.trim(),
      email,
      legsCount: data.legs.length,
      firstServiceDate: firstDate,
      pricing,
      stripeEnabled: wantsOnline,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[createBooking] unexpected error:", msg);
    return fail("Ha ocurrido un error inesperado. Inténtalo de nuevo más tarde.");
  }
}

// ---------------------------------------------------------------------------
// Email helper (runs async, doesn't block the response)
// ---------------------------------------------------------------------------

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function sendConfirmationEmail(
  supabase: SupabaseAdmin,
  bookingId: string,
  bookingCode: string,
  recipientEmail: string,
  data: BookingFormData,
  pricing: PricingBreakdown,
) {
  const TEMPLATE_KEY = "booking_confirmation";

  try {
    /* Resolve accommodation IDs → names in a single batch query */
    const allIds = data.legs.flatMap((l) => [
      l.pickupAccommodationId,
      l.dropoffAccommodationId,
    ]);
    const uniqueIds = [...new Set(allIds)];

    const { data: accs } = await supabase
      .from("accommodations")
      .select("id, name")
      .in("id", uniqueIds);

    const nameMap = new Map((accs ?? []).map((a) => [a.id, a.name]));

    /* Build template data */
    const templateData: BookingConfirmationData = {
      bookingCode,
      customerName: data.customer.fullName.trim(),
      legs: data.legs.map((leg) => ({
        serviceDate: leg.serviceDate,
        pickupName: nameMap.get(leg.pickupAccommodationId) ?? "—",
        dropoffName: nameMap.get(leg.dropoffAccommodationId) ?? "—",
        bagsCount: leg.bagsCount,
        overweightBagsCount: leg.overweightBagsCount,
      })),
      subtotalAmount: pricing.subtotalAmount,
      discountAmount: pricing.discountAmount,
      extraWeightAmount: pricing.extraWeightAmount,
      totalAmount: pricing.totalAmount,
      customerNotes: data.customer.notes.trim() || null,
    };

    const subject = bookingConfirmationSubject(bookingCode);
    const html = bookingConfirmationHtml(templateData);

    /* Generate invoice PDF */
    const invoiceData: InvoiceData = {
      bookingCode,
      customerName: data.customer.fullName.trim(),
      customerEmail: recipientEmail,
      legs: data.legs.map((leg) => ({
        serviceDate: leg.serviceDate,
        pickupName: nameMap.get(leg.pickupAccommodationId) ?? "—",
        dropoffName: nameMap.get(leg.dropoffAccommodationId) ?? "—",
        bagsCount: leg.bagsCount,
        overweightBagsCount: leg.overweightBagsCount,
      })),
      subtotalAmount: pricing.subtotalAmount,
      discountAmount: pricing.discountAmount,
      extraWeightAmount: pricing.extraWeightAmount,
      totalAmount: pricing.totalAmount,
      customerNotes: data.customer.notes.trim() || null,
    };

    let pdfAttachment: { filename: string; content: Uint8Array; contentType: string } | undefined;
    try {
      const pdfBytes = await generateInvoicePdf(invoiceData);
      pdfAttachment = {
        filename: `proforma-${bookingCode}.pdf`,
        content: pdfBytes,
        contentType: "application/pdf",
      };
    } catch (pdfErr) {
      console.error("[booking-email] PDF generation failed:", pdfErr instanceof Error ? pdfErr.message : pdfErr);
    }

    /* Send */
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      attachments: pdfAttachment ? [pdfAttachment] : undefined,
    });

    /* Log to email_logs */
    await supabase.from("email_logs").insert({
      booking_id: bookingId,
      recipient: recipientEmail,
      template_key: TEMPLATE_KEY,
      status: result.sent ? "sent" : "failed",
      external_message_id: result.messageId ?? null,
      error_message: result.error ?? null,
    });

    /* Update booking.email_status */
    await supabase
      .from("bookings")
      .update({ email_status: result.sent ? ("sent" as const) : ("failed" as const) })
      .eq("id", bookingId);

    /* Log event */
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "email_sent" as const,
      actor_type: "system" as const,
      payload_json: {
        template: TEMPLATE_KEY,
        recipient: recipientEmail,
        sent: result.sent,
        message_id: result.messageId ?? null,
        error: result.error ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[booking-email] Unexpected error:", message);

    try {
      await supabase.from("email_logs").insert({
        booking_id: bookingId,
        recipient: recipientEmail,
        template_key: TEMPLATE_KEY,
        status: "failed",
        error_message: message,
      });
    } catch { /* best-effort logging */ }

    try {
      await supabase
        .from("bookings")
        .update({ email_status: "failed" as const })
        .eq("id", bookingId);
    } catch { /* best-effort update */ }
  }
}
