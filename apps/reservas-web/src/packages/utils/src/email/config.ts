export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

/**
 * Returns SMTP configuration from env vars, or null if not configured.
 * A missing config is NOT an error — email sending is gracefully skipped.
 */
export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    fromName: process.env.SMTP_FROM_NAME || "Easy Brais",
    fromEmail: process.env.SMTP_FROM_EMAIL || user,
  };
}
