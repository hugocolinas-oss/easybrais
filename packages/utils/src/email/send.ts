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
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
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

    const mailOpts: Record<string, unknown> = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
    };

    if (input.attachments?.length) {
      mailOpts.attachments = input.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.contentType ?? "application/pdf",
      }));
    }

    const info = await transport.sendMail(mailOpts);

    return {
      sent: true,
      messageId: info.messageId || undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] Send failed:", message);
    return { sent: false, error: message };
  }
}
