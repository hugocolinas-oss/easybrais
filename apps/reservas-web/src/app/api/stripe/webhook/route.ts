import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@easybrais/utils";
import { sendEmail, type EmailAttachment } from "@easybrais/utils/email";
import { generateInvoicePdf } from "@easybrais/utils/pdf";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("[stripe/webhook] missing signature or webhook secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      default:
        console.log(`[stripe/webhook] unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[CRITICAL][stripe/webhook] error processing ${event.type}:`, err);
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// checkout.session.completed — pago exitoso
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.error("[stripe/webhook] completed: no booking_id in metadata");
    return;
  }

  const supabase = createAdminClient();

  /* ── Idempotency: check if already processed ─────────────────── */

  const { data: current } = await supabase
    .from("bookings")
    .select("id, payment_status, status")
    .eq("id", bookingId)
    .single();

  if (!current) {
    console.error("[stripe/webhook] completed: booking not found:", bookingId);
    return;
  }

  if (current.payment_status === "paid") {
    console.log("[stripe/webhook] completed: already paid, skipping:", bookingId);
    return;
  }

  /* ── Update booking ──────────────────────────────────────────── */

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.toString() ?? null;

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      status: "confirmed",
      stripe_payment_intent: paymentIntent,
      paid_at: now,
      payment_method: "online_stripe",
    } as any)
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[CRITICAL][stripe/webhook] completed: booking update failed:", updateErr.message, "bookingId:", bookingId);
    return;
  }

  /* ── Events ──────────────────────────────────────────────────── */

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "payment_received" as const,
    actor_type: "system" as const,
    payload_json: {
      provider: "stripe",
      session_id: session.id,
      payment_intent: paymentIntent,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
    },
  });

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "status_changed" as const,
    actor_type: "system" as const,
    payload_json: {
      from: current.status,
      to: "confirmed",
      reason: "stripe_payment_completed",
    },
  });

  console.log("[stripe/webhook] completed: booking", bookingId, "marked as paid+confirmed");

  /* ── Send confirmation email ─────────────────────────────────── */

  await sendConfirmationEmailAfterPayment(supabase, bookingId);
}

// ---------------------------------------------------------------------------
// checkout.session.expired — sesión expirada sin pago
// ---------------------------------------------------------------------------

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.error("[stripe/webhook] expired: no booking_id in metadata");
    return;
  }

  const supabase = createAdminClient();

  /* ── Idempotency: only expire if still pending_payment ───────── */

  const { data: current } = await supabase
    .from("bookings")
    .select("id, status, payment_status")
    .eq("id", bookingId)
    .single();

  if (!current) return;

  if (current.payment_status === "paid") {
    console.log("[stripe/webhook] expired: already paid, skipping:", bookingId);
    return;
  }

  const status = current.status as string;
  if (status !== "pending_payment" && status !== "pending") {
    console.log("[stripe/webhook] expired: status is", status, "— skipping");
    return;
  }

  /* ── Update booking to payment_expired ───────────────────────── */

  const { error: updateErr } = await supabase
    .from("bookings")
    .update({
      status: "payment_expired",
    } as any)
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[CRITICAL][stripe/webhook] expired: booking update failed:", updateErr.message, "bookingId:", bookingId);
    return;
  }

  console.log("[stripe/webhook] expired: booking", bookingId, "marked as payment_expired");

  /* ── Event ───────────────────────────────────────────────────── */

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "payment_expired" as never,
    actor_type: "system" as const,
    payload_json: {
      provider: "stripe",
      session_id: session.id,
      previous_status: current.status,
    },
  });
}

// ---------------------------------------------------------------------------
// Email helper — sends confirmation + invoice after successful payment
// ---------------------------------------------------------------------------

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function sendConfirmationEmailAfterPayment(
  supabase: SupabaseAdmin,
  bookingId: string,
) {
  try {
    const { data: bk } = await supabase
      .from("bookings")
      .select(
        `id, booking_code, service_date, booking_type, language,
        notes_customer, subtotal_amount, discount_amount,
        extra_weight_amount, total_amount,
        customers(full_name, email, phone),
        booking_items(
          service_date, bags_count, overweight_bags_count,
          pickup_accommodation:accommodations!booking_items_pickup_accommodation_id_fkey(name, town),
          dropoff_accommodation:accommodations!booking_items_dropoff_accommodation_id_fkey(name, town)
        )`,
      )
      .eq("id", bookingId)
      .single();

    if (!bk) return;

    const cust = bk.customers as unknown as {
      full_name: string;
      email: string;
      phone?: string;
    } | null;
    if (!cust?.email) return;

    const items = (bk.booking_items ?? []) as unknown as Array<{
      service_date: string;
      bags_count: number;
      overweight_bags_count: number;
      pickup_accommodation: { name: string; town: string | null } | null;
      dropoff_accommodation: { name: string; town: string | null } | null;
    }>;

    /* ── HTML email ────────────────────────────────────────────── */

    const legsHtml = items
      .map(
        (it) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${it.service_date}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${it.pickup_accommodation?.name ?? "—"} (${it.pickup_accommodation?.town ?? ""})</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${it.dropoff_accommodation?.name ?? "—"} (${it.dropoff_accommodation?.town ?? ""})</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.bags_count}</td>
          </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;font-family:Inter,Helvetica,Arial,sans-serif;background:#F8F4EC;color:#003C2F">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,60,47,.08)">
  <div style="background:#003C2F;padding:32px 24px;text-align:center">
    <h1 style="margin:0;color:#C49A6C;font-size:22px;font-weight:700">Easy Brais</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,.6);font-size:13px">Camino Portugués — Transporte de equipaje</p>
  </div>
  <div style="padding:32px 24px">
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center">
      <p style="margin:0;font-size:14px;color:#166534;font-weight:600">Pago confirmado</p>
      <p style="margin:8px 0 0;font-size:28px;font-weight:800;letter-spacing:2px;color:#003C2F">${bk.booking_code}</p>
    </div>
    <p style="margin:0 0 16px;font-size:14px">Hola <strong>${cust.full_name}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6">Tu reserva ha sido confirmada y el pago procesado correctamente.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#f5f5f4">
        <th style="padding:8px;text-align:left">Fecha</th>
        <th style="padding:8px;text-align:left">Recogida</th>
        <th style="padding:8px;text-align:left">Entrega</th>
        <th style="padding:8px;text-align:center">Mochilas</th>
      </tr></thead>
      <tbody>${legsHtml}</tbody>
    </table>
    <div style="margin-top:24px;padding:16px;background:#fafaf9;border-radius:8px">
      <table style="width:100%;font-size:13px">
        <tr><td>Subtotal</td><td style="text-align:right">${Number(bk.subtotal_amount).toFixed(2)} €</td></tr>
        ${Number(bk.discount_amount) > 0 ? `<tr><td>Descuento volumen</td><td style="text-align:right;color:#16a34a">−${Number(bk.discount_amount).toFixed(2)} €</td></tr>` : ""}
        ${Number(bk.extra_weight_amount) > 0 ? `<tr><td>Sobrepeso</td><td style="text-align:right">${Number(bk.extra_weight_amount).toFixed(2)} €</td></tr>` : ""}
        <tr style="font-weight:700;font-size:15px"><td style="padding-top:8px">Total pagado</td><td style="padding-top:8px;text-align:right;color:#003C2F">${Number(bk.total_amount).toFixed(2)} €</td></tr>
      </table>
    </div>
    ${bk.notes_customer ? `<p style="margin:24px 0 0;font-size:13px;color:#666"><strong>Observaciones:</strong> ${bk.notes_customer}</p>` : ""}
    <p style="margin:32px 0 0;font-size:13px;color:#999;text-align:center">Entrega garantizada antes de las 15:30</p>
  </div>
</div>
</body></html>`;

    /* ── Invoice PDF ───────────────────────────────────────────── */

    let attachments: EmailAttachment[] = [];
    try {
      const pdfBytes = await generateInvoicePdf({
        bookingCode: bk.booking_code,
        customerName: cust.full_name,
        customerEmail: cust.email,
        legs: items.map((it) => ({
          serviceDate: it.service_date,
          pickupName: it.pickup_accommodation?.name ?? "—",
          dropoffName: it.dropoff_accommodation?.name ?? "—",
          bagsCount: it.bags_count,
          overweightBagsCount: it.overweight_bags_count,
        })),
        subtotalAmount: Number(bk.subtotal_amount),
        discountAmount: Number(bk.discount_amount),
        extraWeightAmount: Number(bk.extra_weight_amount),
        totalAmount: Number(bk.total_amount),
      });
      attachments = [
        {
          filename: `factura-${bk.booking_code}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: "application/pdf",
        },
      ];
    } catch (pdfErr) {
      console.error("[stripe/webhook] invoice PDF failed:", pdfErr);
    }

    /* ── Send ──────────────────────────────────────────────────── */

    const emailResult = await sendEmail({
      to: cust.email,
      subject: `Confirmación de pago — ${bk.booking_code}`,
      html,
      attachments,
    });

    /* ── Log ───────────────────────────────────────────────────── */

    await supabase.from("email_logs" as never).insert({
      booking_id: bk.id,
      recipient: cust.email,
      template_key: "payment_confirmation",
      status: emailResult.sent ? "sent" : "failed",
      error_message: emailResult.sent ? null : (emailResult.error ?? null),
    } as never);
  } catch (err) {
    console.error("[stripe/webhook] email send failed:", err);
  }
}
