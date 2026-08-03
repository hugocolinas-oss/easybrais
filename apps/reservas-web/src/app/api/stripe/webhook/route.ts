import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getStripeWebhookSecret } from "@/lib/stripe-webhook-secret";
import { createAdminClient } from "@easybrais/utils";
import { sendAdminNewReservationEmail, sendPaymentConfirmedEmail } from "@/lib/email/reservations";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = await getStripeWebhookSecret();
  const requestId = req.headers.get("x-vercel-id");

  console.log(JSON.stringify({
    level: "info",
    message: "Stripe webhook received",
    route: "/api/stripe/webhook",
    requestId,
    hasSignature: Boolean(sig),
  }));

  if (!webhookSecret) {
    console.error("[stripe/webhook] missing webhook secret");
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  if (!sig) {
    console.error("[stripe/webhook] missing signature");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: Stripe.Event;
  let stripe: Awaited<ReturnType<typeof getStripe>>;

  try {
    stripe = await getStripe();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] Stripe client is not configured:", msg);
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  try {
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
      case "checkout.session.async_payment_succeeded": {
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
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
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

  if (session.payment_status !== "paid") {
    console.log("[stripe/webhook] completed: payment is not paid yet:", session.id);
    return;
  }

  /* ── Idempotency: check if already processed ─────────────────── */

  const { data: current } = await supabase
    .from("bookings")
    .select("id, booking_code, total_amount, payment_status, status, stripe_session_id")
    .eq("id", bookingId)
    .single();

  if (!current) {
    throw new Error(`Booking not found for Stripe session ${session.id}`);
  }

  const expectedAmount = Math.round(Number(current.total_amount) * 100);
  if (
    current.stripe_session_id !== session.id
    || session.client_reference_id !== bookingId
    || session.metadata?.booking_code !== current.booking_code
    || session.currency !== "eur"
    || session.amount_total !== expectedAmount
  ) {
    throw new Error(`Stripe session validation failed for booking ${bookingId}`);
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

  const { data: updated, error: updateErr } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      status: "confirmed",
      stripe_payment_intent: paymentIntent,
      paid_at: now,
      payment_method: "online_stripe",
    })
    .eq("id", bookingId)
    .eq("stripe_session_id", session.id)
    .neq("payment_status", "paid")
    .select("id")
    .maybeSingle();

  if (updateErr) {
    throw new Error(`Booking payment update failed: ${updateErr.message}`);
  }

  if (!updated) {
    console.log("[stripe/webhook] completed: concurrently processed, skipping:", bookingId);
    return;
  }

  /* ── Events ──────────────────────────────────────────────────── */

  const { error: paymentEventError } = await supabase.from("booking_events").insert({
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
  if (paymentEventError) {
    console.error("[stripe/webhook] payment event insert failed:", paymentEventError.message);
  }

  if (current.status !== "confirmed") {
    const { error: statusEventError } = await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "status_changed" as const,
      actor_type: "system" as const,
      payload_json: {
        from: current.status,
        to: "confirmed",
        reason: "stripe_payment_completed",
      },
    });
    if (statusEventError) {
      console.error("[stripe/webhook] status event insert failed:", statusEventError.message);
    }
  }

  console.log("[stripe/webhook] completed: booking", bookingId, "marked as paid+confirmed");

  /* ── Email de confirmación de pago al cliente ────────────────── */
  try {
    const emailResult = await sendPaymentConfirmedEmail(bookingId, supabase);
    if (!emailResult.sent) {
      console.warn("[stripe/webhook] payment email not sent:", emailResult.error ?? "unknown");
    } else {
      console.log("[stripe/webhook] payment confirmation email sent for booking", bookingId);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] payment email error:", msg);
  }

  try {
    const adminEmailResult = await sendAdminNewReservationEmail(bookingId, supabase);
    if (!adminEmailResult.sent) {
      console.warn("[stripe/webhook] admin reservation email not sent:", adminEmailResult.error ?? "unknown");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] admin reservation email error:", msg);
  }
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

  /* ── Idempotency: only expire if still unpaid ─────────────────── */

  const { data: current } = await supabase
    .from("bookings")
    .select("id, status, payment_status, stripe_session_id")
    .eq("id", bookingId)
    .single();

  if (!current) return;

  if (current.stripe_session_id !== session.id) {
    console.log("[stripe/webhook] expired: stale session, skipping:", session.id);
    return;
  }

  if (current.payment_status === "paid") {
    console.log("[stripe/webhook] expired: already paid, skipping:", bookingId);
    return;
  }

  const status = current.status as string;
  if (status !== "pending_payment" && status !== "pending") {
    console.log("[stripe/webhook] expired: status is", status, "— skipping");
    return;
  }

  /* ── Mark the unpaid booking as expired ───────────────────────── */

  const { error: updateErr } = await supabase
    .from("bookings")
    .update({
      status: "payment_expired",
    })
    .eq("id", bookingId)
    .eq("stripe_session_id", session.id)
    .neq("payment_status", "paid")
    .in("status", ["pending", "pending_payment"]);

  if (updateErr) {
    throw new Error(`Expired booking update failed: ${updateErr.message}`);
  }

  console.log("[stripe/webhook] expired: booking", bookingId, "marked as payment_expired");

  /* ── Event ───────────────────────────────────────────────────── */

  const { error: eventError } = await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "payment_expired" as const,
    actor_type: "system" as const,
    payload_json: {
      provider: "stripe",
      session_id: session.id,
      previous_status: current.status,
      payment_status: current.payment_status,
    },
  });
  if (eventError) {
    console.error("[stripe/webhook] expiry event insert failed:", eventError.message);
  }
}
