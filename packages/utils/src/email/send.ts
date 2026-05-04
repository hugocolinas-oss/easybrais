import { getSmtpConfig } from "./config";
import { getTransport } from "./transport";

export interface EmailAttachment {
  filename: string;
  content: Buffer | Uint8Array;
  contentType?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

function buildMailOptions(
  config: NonNullable<ReturnType<typeof getSmtpConfig>>,
  input: SendEmailInput,
  includeAttachments: boolean,
): Record<string, unknown> {
  const mailOpts: Record<string, unknown> = {
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo ?? config.replyTo,
  };

  if (includeAttachments && input.attachments?.length) {
    mailOpts.attachments = input.attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content),
      contentType: a.contentType ?? "application/pdf",
    }));
  }

  return mailOpts;
}

/**
 * Send a transactional email via SMTP.
 * Returns { sent: false } gracefully if SMTP is not configured (dev/test).
 * Never throws — caller gets a result object.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getSmtpConfig();

  if (!config) {
    console.warn("[email] SMTP not configured — skipping send to", input.to);
    return { sent: false, error: "SMTP not configured" };
  }

  try {
    const transport = getTransport(config);
    const hasPdf = !!input.attachments?.length;

    try {
      const info = await transport.sendMail(buildMailOptions(config, input, true));
      return { sent: true, messageId: info.messageId || undefined };
    } catch (firstErr) {
      if (!hasPdf) throw firstErr;
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      console.warn("[email] Send with PDF failed, retrying body-only:", msg);
      const info = await transport.sendMail(buildMailOptions(config, input, false));
      return { sent: true, messageId: info.messageId || undefined };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] Send failed:", message);
    return { sent: false, error: message };
  }
}

export async function sendTestEmail(adminEmail: string): Promise<SendEmailResult> {
  return sendEmail({
    to: adminEmail,
    subject: "Test SMTP Easy Brais",
    html: [
      "<p>Proba correcta de envio SMTP desde o SaaS de Easy Brais.</p>",
      "<p>Dominio configurado: https://reservas.easybrais.es/</p>",
    ].join(""),
  });
}
