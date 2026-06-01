import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@easybrais/utils";

const PAYMENT_WINDOW_SECONDS = 3600; // 1 hour

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe no está configurado. Contacta con soporte." },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const { bookingId } = body as { bookingId: string };

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    /* ── 1. Fetch booking with validation ──────────────────────────── */

    const { data: rawBooking, error: fetchErr } = await supabase
      .from("bookings")
      .select(
        "id, booking_code, total_amount, payment_status, status, stripe_session_id, customers(full_name, email)",
      )
      .eq("id", bookingId)
      .single();

    if (fetchErr || !rawBooking) {
      console.error("[stripe/checkout] booking fetch error:", fetchErr?.message);
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // Cast needed: stripe_session_id comes from migration 011, not in generated types
    const booking = rawBooking as unknown as {
      id: string;
      booking_code: string;
      total_amount: number;
      payment_status: string;
      status: string;
      stripe_session_id: string | null;
      customers: { full_name: string; email: string } | null;
    };

    /* ── 2. Guard: already paid ────────────────────────────────────── */

    if (booking.payment_status === "paid") {
      return NextResponse.json(
        { error: "Esta reserva ya está pagada." },
        { status: 400 },
      );
    }

    /* ── 3. Guard: invalid booking status ──────────────────────────── */

    const allowedStatuses = ["confirmed", "pending", "pending_payment", "payment_expired"];
    if (!allowedStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: `No se puede pagar una reserva en estado "${booking.status}".` },
        { status: 400 },
      );
    }

    /* ── 4. Guard: reuse existing active session (idempotency) ─────── */

    if (booking.stripe_session_id) {
      try {
        const stripe = getStripe();
        const existing = await stripe.checkout.sessions.retrieve(
          booking.stripe_session_id,
        );

        if (existing.status === "open" && existing.url) {
          return NextResponse.json({ url: existing.url });
        }
        // Session is expired/completed — allow creating a new one
      } catch {
        // Session retrieval failed — allow creating a new one
      }
    }

    /* ── 5. Validate amount ────────────────────────────────────────── */

    const amountCents = Math.round(Number(booking.total_amount) * 100);
    if (!amountCents || amountCents < 50) {
      return NextResponse.json(
        { error: "El importe mínimo para pago online es 0,50 €." },
        { status: 400 },
      );
    }

    /* ── 6. Create Stripe Checkout Session ─────────────────────────── */

    const customer = booking.customers as unknown as {
      full_name: string;
      email: string;
    } | null;

    const stripe = getStripe();
    const origin = req.nextUrl.origin;
    const expiresAt = Math.floor(Date.now() / 1000) + PAYMENT_WINDOW_SECONDS;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer?.email ?? undefined,
      client_reference_id: booking.id,
      metadata: {
        booking_id: booking.id,
        booking_code: booking.booking_code,
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `Transporte de equipaje — ${booking.booking_code}`,
              description: `Reserva ${booking.booking_code} — Easy Brais Camino Portugués`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/reserva/exito?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${origin}/reserva/cancelado?booking_id=${booking.id}`,
      expires_at: expiresAt,
    });

    /* ── 7. Update booking payment metadata ───────────────────────── */

    const paymentExpiresAt = new Date(expiresAt * 1000).toISOString();

    const updates: Record<string, string> = {
      stripe_session_id: session.id,
      payment_method: "online_stripe",
      payment_expires_at: paymentExpiresAt,
    };

    if (booking.status !== "confirmed") {
      updates.status = "confirmed";
    }

    const { error: updateErr } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", booking.id);

    if (updateErr) {
      console.error("[stripe/checkout] booking update error:", updateErr.message);
    }

    /* ── 8. Log event ──────────────────────────────────────────────── */

    const eventType: "updated" | "status_changed" =
      booking.status === "confirmed" ? "updated" : "status_changed";

    await supabase.from("booking_events").insert({
      booking_id: booking.id,
      event_type: eventType,
      actor_type: "system" as const,
      payload_json: {
        from: booking.status,
        to: "confirmed",
        reason: "stripe_checkout_created",
        stripe_session_id: session.id,
        amount_cents: amountCents,
        expires_at: paymentExpiresAt,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout] error:", msg);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago." },
      { status: 500 },
    );
  }
}
