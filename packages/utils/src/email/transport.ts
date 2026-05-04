import { createTransport, type Transporter } from "nodemailer";
import type { SmtpConfig } from "./config";

/** Sin singleton: evita conexiones SMTP obsoletas entre invocaciones serverless. */
export function getTransport(config: SmtpConfig): Transporter {
  const useTlsUpgrade = !config.secure && config.port === 587;

  return createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    requireTLS: useTlsUpgrade,
    connectionTimeout: 25_000,
    greetingTimeout: 20_000,
    socketTimeout: 25_000,
  });
}
