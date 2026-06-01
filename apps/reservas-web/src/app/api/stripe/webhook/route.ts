import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@easybrais/utils";
import { sendPaymentConfirmedEmail } from "@/lib/email/reservations";
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
    })
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
    .select("id, status, payment_status")
    .eq("id", bookingId)
    .single();

  if (!current) return;

  if (current.payment_status === "paid") {
    console.log("[stripe/webhook] expired: already paid, skipping:", bookingId);
    return;
  }

  const status = current.status as string;
  if (status === "cancelled") {
    console.log("[stripe/webhook] expired: booking is cancelled — skipping");
    return;
  }

  /* ── Keep booking confirmed and record expiry in metadata/events ─ */

  const { error: updateErr } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
    })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[CRITICAL][stripe/webhook] expired: booking update failed:", updateErr.message, "bookingId:", bookingId);
    return;
  }

  console.log("[stripe/webhook] expired: booking", bookingId, "kept confirmed with expired payment session");

  /* ── Event ───────────────────────────────────────────────────── */

  await supabase.from("booking_events").insert({
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
}
