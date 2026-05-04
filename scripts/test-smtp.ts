import { getSmtpConfig, sendTestEmail } from "../packages/utils/src/email";

function fail(message: string): never {
  console.error(`[smtp:test] ${message}`);
  process.exit(1);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) fail("Falta ADMIN_EMAIL en el entorno.");

  const config = getSmtpConfig();
  if (!config) fail("Faltan variables SMTP obligatorias en .env.local.");

  console.log("[smtp:test] Iniciando prueba SMTP...");
  console.log(`[smtp:test] Host: ${config.host}`);
  console.log(`[smtp:test] Puerto: ${config.port}`);
  console.log(`[smtp:test] Remitente: ${config.fromName} <${config.fromEmail}>`);
  console.log(`[smtp:test] Destinatario: ${adminEmail}`);

  const result = await sendTestEmail(adminEmail);

  if (!result.sent) {
    fail(`Envio fallido: ${result.error ?? "erro descoñecido"}`);
  }

  console.log("[smtp:test] Email enviado correctamente.");
  if (result.messageId) {
    console.log(`[smtp:test] Message-ID: ${result.messageId}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(`Erro inesperado: ${message}`);
});
