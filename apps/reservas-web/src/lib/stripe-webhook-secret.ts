import { createAdminClient } from "@easybrais/utils";

const STRIPE_WEBHOOK_SECRET_NAME = "stripe_webhook_secret";

let cachedWebhookSecret: string | null = null;

export async function getStripeWebhookSecret(): Promise<string | null> {
  const environmentSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (environmentSecret) {
    return environmentSecret;
  }

  if (cachedWebhookSecret) {
    return cachedWebhookSecret;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_runtime_secret", {
    secret_name: STRIPE_WEBHOOK_SECRET_NAME,
  });

  if (error) {
    console.error("[stripe/webhook] unable to read signing secret:", error.message);
    return null;
  }

  if (typeof data !== "string" || !data.startsWith("whsec_")) {
    console.error("[stripe/webhook] signing secret is missing or invalid");
    return null;
  }

  cachedWebhookSecret = data;
  return cachedWebhookSecret;
}
