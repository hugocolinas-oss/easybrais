"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, calculatePricing, getRealEtapas, getRealEtapasForStages, resolvePerBagPrice, resolveRouteStagePrice, type PricingBreakdown } from "@easybrais/utils";
import type { BookingFormData } from "@/lib/types";
import { isStripeConfigured } from "@/lib/stripe";
import { sendReservationEmails } from "@/lib/email/reservations";
import { isPhoneValueValid, normalizePhoneValue } from "@/lib/phone";
import { getAccommodationPricingStage, getAccommodationSequence, isValidAccommodationLeg } from "@/lib/accommodation-order";
import type { RouteStage } from "@/lib/types";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/translations";

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
  paymentMethod: "online" | "cash";
  paymentError?: string;
  /** Si el correo al cliente se entregó vía SMTP (reserva nueva). */
  customerEmailSent: boolean;
  customerEmailError?: string;
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

function normalizeCustomerLanguage(value: string | null | undefined): Locale {
  const normalized = value?.trim().toLowerCase() as Locale | undefined;
  return normalized && SUPPORTED_LOCALES.includes(normalized) ? normalized : "es";
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
  const normalizedPhone = normalizePhoneValue(data.customer.phone ?? "");
  const normalizedLanguage = normalizeCustomerLanguage(data.customer.language);
  if (!normalizedPhone) return fail("El teléfono es obligatorio.");
  if (!isPhoneValueValid(normalizedPhone)) return fail("El teléfono no es válido.");
  if (normalizedPhone && normalizedPhone.length > 30)
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
    const stripeEnabled = await isStripeConfigured();
    const paymentMethod = data.paymentMethod === "cash" ? "cash" : "online";
    if (paymentMethod === "online" && !stripeEnabled) {
      return fail("El pago online no está disponible ahora mismo. Elige pago el día del servicio.");
    }

    const supabase = createAdminClient();

    /* ── Resolve stage distances for pricing ─────────────────────────── */

    const allAccIds = data.legs.flatMap((l) => [l.pickupAccommodationId, l.dropoffAccommodationId]);
    const uniqueAccIds = [...new Set(allAccIds)];

    const { data: accRows } = await supabase
      .from("accommodations")
      .select("id, external_code, sort_order, route_stage:route_stages!accommodations_route_stage_id_fkey(code, name, route_section, branch_sequence, price_to_redondela)")
      .in("id", uniqueAccIds);

    type AccRow = { id: string; external_code: string | null; sort_order: number; route_stage: RouteStage | null };
    const accLookup = new Map(((accRows ?? []) as unknown as AccRow[]).map((a) => [a.id, a]));

    function stageNumber(code: string | null): number | null {
      if (!code) return null;
      const n = parseInt(code.split(".")[0] ?? "", 10);
      return Number.isNaN(n) ? null : n;
    }

    function getLegPrefixes(pickupId: string, dropoffId: string) {
      const p = stageNumber(accLookup.get(pickupId)?.external_code ?? null);
      const d = stageNumber(accLookup.get(dropoffId)?.external_code ?? null);
      const pickupAcc = accLookup.get(pickupId);
      const dropoffAcc = accLookup.get(dropoffId);
      const pickupStage = pickupAcc ? getAccommodationPricingStage(pickupAcc) : null;
      const dropoffStage = dropoffAcc ? getAccommodationPricingStage(dropoffAcc) : null;
      const etapas = pickupStage && dropoffStage
        ? getRealEtapasForStages(pickupStage, dropoffStage)
        : p !== null && d !== null ? getRealEtapas(p, d) : 1;
      return { pickupPrefix: p, dropoffPrefix: d, stagesCount: etapas, pickupStage, dropoffStage };
    }

    for (const [i, leg] of data.legs.entries()) {
      const pickupSeq = getAccommodationSequence(
        accLookup.get(leg.pickupAccommodationId) ?? { external_code: null, sort_order: 0, route_stage: null },
      );
      const dropoffSeq = getAccommodationSequence(
        accLookup.get(leg.dropoffAccommodationId) ?? { external_code: null, sort_order: 0, route_stage: null },
      );
      const { pickupPrefix, dropoffPrefix } = getLegPrefixes(leg.pickupAccommodationId, leg.dropoffAccommodationId);
      const pickupAcc = accLookup.get(leg.pickupAccommodationId);
      const dropoffAcc = accLookup.get(leg.dropoffAccommodationId);
      const invalidByStage = pickupAcc && dropoffAcc && pickupAcc.route_stage && dropoffAcc.route_stage
        ? !isValidAccommodationLeg(pickupAcc, dropoffAcc)
        : false;
      if (invalidByStage || (pickupSeq !== null && dropoffSeq !== null && dropoffSeq < pickupSeq)) {
        return fail(`Tramo ${i + 1}: la entrega (código ${dropoffPrefix}) no puede ser anterior a la recogida (código ${pickupPrefix}).`);
      }
    }

    const pricing = calculatePricing(
      data.legs.map((l) => {
        const { pickupPrefix, dropoffPrefix, stagesCount, pickupStage, dropoffStage } = getLegPrefixes(l.pickupAccommodationId, l.dropoffAccommodationId);
        return {
          bagsCount: l.bagsCount,
          overweightBagsCount: l.overweightBagsCount,
          stagesCount,
          pickupPrefix,
          dropoffPrefix,
          pickupStage,
          dropoffStage,
        };
      }),
    );

    /* ── Idempotency check ───────────────────────────────────────────── */

    const tag = `idem:${idempotencyKey}`;

    const { data: existing, error: idemErr } = await supabase
      .from("bookings")
      .select("id, booking_code, payment_method")
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
        stripeEnabled: existing.payment_method === "online_stripe" && stripeEnabled,
        paymentMethod: existing.payment_method === "online_stripe" ? "online" : "cash",
        customerEmailSent: false,
        customerEmailError: "Solicitud duplicada: esta reserva ya estaba registrada. Revisa tu correo (incl. spam) o contacta con nosotros.",
      };
    }

    /* ── 1. Find or create customer ────────────────────────────────── */

    const email = data.customer.email.trim().toLowerCase();

    const { data: existingCustomer, error: custFindErr } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    let customer = existingCustomer;

    if (custFindErr) {
      console.error("[createBooking] customer lookup failed:", custFindErr.message);
    }

    if (!customer) {
      const { data: created, error } = await supabase
        .from("customers")
        .insert({
          full_name: data.customer.fullName.trim(),
          email,
          phone: normalizedPhone || null,
          language: normalizedLanguage,
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
          phone: normalizedPhone || null,
          language: normalizedLanguage,
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
        status: paymentMethod === "online" ? "pending_payment" as const : "confirmed" as const,
        source_channel: (data.sourceChannel ?? "web") as never,
        language: normalizedLanguage,
        notes_customer: data.customer.notes.trim() || null,
        notes_internal: tag,
        subtotal_amount: pricing.subtotalAmount,
        discount_amount: pricing.discountAmount,
        extra_weight_amount: pricing.extraWeightAmount,
        total_amount: pricing.totalAmount,
        payment_method: paymentMethod === "cash" ? "cash" : "online_stripe",
      })
      .select("id")
      .single();

    if (bookErr || !booking) {
      console.error("[createBooking] booking insert failed:", bookErr?.message);
      return fail("Error al crear la reserva. Inténtalo de nuevo.");
    }

    /* ── 4. Create booking items ──────────────────────────────────── */

    const items = data.legs.map((leg) => {
      const { pickupPrefix, dropoffPrefix, stagesCount, pickupStage, dropoffStage } = getLegPrefixes(leg.pickupAccommodationId, leg.dropoffAccommodationId);
      const perBag = pickupStage && dropoffStage
        ? resolveRouteStagePrice(pickupStage, dropoffStage)
        : resolvePerBagPrice(pickupPrefix, dropoffPrefix, stagesCount);
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
        payment_method: paymentMethod === "online" ? "online_stripe" : "cash",
        initial_status: paymentMethod === "online" ? "pending_payment" : "confirmed",
      },
    });

    if (eventErr) {
      console.error("[createBooking] event insert failed:", eventErr.message);
    }

    /* ── 6. Determine payment flow ─────────────────────────────────── */

    const wantsOnline = paymentMethod === "online";

    /* ── 7. Envío de correos (await: en serverless/Vercel las promesas “sueltas” se cortan al devolver la respuesta) */

    let customerEmailSent = false;
    let customerEmailError: string | undefined;
    if (!wantsOnline) {
      try {
        const emailOutcome = await sendReservationEmails(booking.id, supabase);
        customerEmailSent = emailOutcome.customer.sent;
        customerEmailError = emailOutcome.customer.error;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[createBooking] reservation emails failed:", message);
        customerEmailError = message;
      }
    }

    revalidatePath("/gestion/reservas");
    revalidatePath("/gestion/operativa");
    revalidatePath("/gestion/ruta");
    revalidatePath("/gestion");

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
      paymentMethod,
      customerEmailSent,
      customerEmailError,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[createBooking] unexpected error:", msg);
    return fail("Ha ocurrido un error inesperado. Inténtalo de nuevo más tarde.");
  }
}
