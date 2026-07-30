import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  _stripe = new Stripe(key, {
    typescript: true,
  });

  return _stripe;
}

export function isStripeConfigured(): boolean {
  return process.env.STRIPE_PAYMENTS_ENABLED === "true"
    && !!process.env.STRIPE_SECRET_KEY;
}

export function getStripeReturnOrigin(requestOrigin: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const url = new URL(configuredOrigin || requestOrigin);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("Stripe return URL must use HTTPS in production");
  }

  return url.origin;
}
