import { createTransport, type Transporter } from "nodemailer";
import type { SmtpConfig } from "./config";

let cached: Transporter | null = null;

export function getTransport(config: SmtpConfig): Transporter {
  if (cached) return cached;

  const useTlsUpgrade = !config.secure && config.port === 587;

  cached = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    requireTLS: useTlsUpgrade,
    connectionTimeout: 25_000,
    greetingTimeout: 20_000,
    socketTimeout: 25_000,
  });

  return cached;
}
