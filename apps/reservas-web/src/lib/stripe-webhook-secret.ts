import { getRuntimeSecret } from "@/lib/runtime-secret";

const STRIPE_WEBHOOK_SECRET_NAME = "stripe_webhook_secret";

export async function getStripeWebhookSecret(): Promise<string | null> {
  const environmentSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (environmentSecret) {
    return environmentSecret;
  }

  const secret = await getRuntimeSecret(STRIPE_WEBHOOK_SECRET_NAME);
  if (!secret?.startsWith("whsec_")) {
    console.error("[stripe/webhook] signing secret is missing or invalid");
    return null;
  }

  return secret;
}
