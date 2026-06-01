/**
 * Diagnóstico de correos: email_logs, bookings.email_status, booking_events (email_sent).
 * Ejecutar: pnpm exec tsx --env-file=.env.local scripts/email-diagnostics.ts
 */

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log("Proyecto:", url);
  console.log("");

  const { error: probeErr } = await supabase.from("email_logs").select("id").limit(1);
  if (probeErr?.message.includes("Could not find the table")) {
    console.warn(
      "⚠ La tabla public.email_logs no existe en este proyecto (o el API no la expone).",
    );
    console.warn("  Aplica las migraciones que crean email_logs (p. ej. 20260319_004_email_logs.sql) y recarga el esquema en API settings si hace falta.\n");
  }

  const { data: failedLogs, error: e1 } = await supabase
    .from("email_logs")
    .select(
      "id, created_at, booking_id, recipient, template, template_key, status, error_message, sent_at, subject",
    )
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(40);

  if (e1) {
    console.error("[email_logs failed]", e1.message);
  } else {
    console.log("--- email_logs con status = failed (últimos 40) ---");
    console.log(JSON.stringify(failedLogs ?? [], null, 2));
    console.log(`Total filas: ${failedLogs?.length ?? 0}\n`);
  }

  const { data: recentLogs, error: e2 } = await supabase
    .from("email_logs")
    .select(
      "id, created_at, booking_id, recipient, template, status, error_message, sent_at",
    )
    .order("created_at", { ascending: false })
    .limit(25);

  if (e2) {
    console.error("[email_logs recientes]", e2.message);
  } else {
    console.log("--- email_logs recientes (cualquier status, últimos 25) ---");
    console.log(JSON.stringify(recentLogs ?? [], null, 2));
    console.log("");
  }

  const { data: badBookings, error: e3 } = await supabase
    .from("bookings")
    .select("id, booking_code, email_status, updated_at, payment_status, status")
    .in("email_status", ["failed", "not_sent"])
    .order("updated_at", { ascending: false })
    .limit(40);

  if (e3) {
    console.error("[bookings email_status]", e3.message);
  } else {
    console.log("--- bookings con email_status failed o not_sent (últimos 40 por updated_at) ---");
    console.log(JSON.stringify(badBookings ?? [], null, 2));
    console.log(`Total filas: ${badBookings?.length ?? 0}\n`);
  }

  const { data: emailEvents, error: e4 } = await supabase
    .from("booking_events")
    .select("id, booking_id, created_at, payload_json")
    .eq("event_type", "email_sent")
    .order("created_at", { ascending: false })
    .limit(60);

  if (e4) {
    console.error("[booking_events email_sent]", e4.message);
  } else {
    const rows = emailEvents ?? [];
    const withError = rows.filter((r) => {
      const p = r.payload_json as Record<string, unknown> | null;
      return p && (p.sent === false || (typeof p.error === "string" && p.error.length > 0));
    });
    console.log("--- booking_events email_sent con sent=false o error en payload (de últimos 60) ---");
    console.log(JSON.stringify(withError, null, 2));
    console.log(`Coincidencias: ${withError.length} / ${rows.length} eventos revisados\n`);
  }

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
