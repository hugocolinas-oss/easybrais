import { getRuntimeSecret } from "@/lib/runtime-secret";

const STRIPE_WEBHOOK_SECRET_NAME = "stripe_webhook_secret";

export async function getStripeWebhookSecret(): Promise<string | null> {
  // Signing secrets can be rotated while a Vercel function instance is warm.
  // Prefer Vault so a stale Vercel environment variable cannot block rotation.
  const secret = await getRuntimeSecret(STRIPE_WEBHOOK_SECRET_NAME, { cache: false });
  if (secret?.startsWith("whsec_")) {
    return secret;
  }

  const environmentSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (environmentSecret?.startsWith("whsec_")) {
    return environmentSecret;
  }

  console.error("[stripe/webhook] signing secret is missing or invalid");
  return null;
}
