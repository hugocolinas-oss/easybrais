import { getRuntimeSecret } from "@/lib/runtime-secret";

const STRIPE_WEBHOOK_SECRET_NAME = "stripe_webhook_secret";

export async function getStripeWebhookSecret(): Promise<string | null> {
  const environmentSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (environmentSecret) {
    return environmentSecret;
  }

  // Signing secrets can be rotated while a Vercel function instance is warm.
  // Always read this value from Vault so a rotation takes effect immediately.
  const secret = await getRuntimeSecret(STRIPE_WEBHOOK_SECRET_NAME, { cache: false });
  if (!secret?.startsWith("whsec_")) {
    console.error("[stripe/webhook] signing secret is missing or invalid");
    return null;
  }

  return secret;
}
