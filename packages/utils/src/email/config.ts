export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

/**
 * Returns SMTP configuration from env vars, or null if not configured.
 * A missing config is NOT an error — email sending is gracefully skipped.
 */
export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) return null;

  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || user;
  const replyToRaw = process.env.SMTP_REPLY_TO?.trim();

  return {
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    fromName: process.env.SMTP_FROM_NAME?.trim() || "Easy Brais",
    fromEmail,
    replyTo: replyToRaw || undefined,
  };
}
