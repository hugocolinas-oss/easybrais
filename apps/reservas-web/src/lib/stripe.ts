import Stripe from "stripe";
import { getRuntimeSecret } from "@/lib/runtime-secret";

let _stripe: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  if (_stripe) return _stripe;

  const key = await getRuntimeSecret("stripe_secret_key")
    || process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  _stripe = new Stripe(key, {
    typescript: true,
  });

  return _stripe;
}

export async function isStripeConfigured(): Promise<boolean> {
  const key = await getRuntimeSecret("stripe_secret_key")
    || process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return false;

  const environmentFlag = process.env.STRIPE_PAYMENTS_ENABLED?.trim();
  const enabled = environmentFlag || await getRuntimeSecret("stripe_payments_enabled");
  return enabled === "true";
}

export function getStripeReturnOrigin(requestOrigin: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const url = new URL(configuredOrigin || requestOrigin);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("Stripe return URL must use HTTPS in production");
  }

  return url.origin;
}
