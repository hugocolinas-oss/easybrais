import { createTransport, type Transporter } from "nodemailer";
import type { SmtpConfig } from "./config";

let cached: Transporter | null = null;

export function getTransport(config: SmtpConfig): Transporter {
  if (cached) return cached;

  cached = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });

  return cached;
}
