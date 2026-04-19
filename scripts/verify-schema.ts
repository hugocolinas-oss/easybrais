/**
 * Verifica que las tablas del esquema inicial existen en Supabase.
 * Ejecutar con: npx tsx scripts/verify-schema.ts
 *
 * Requiere que las variables de entorno estén configuradas en .env.local
 */

import { createClient } from "@supabase/supabase-js";

const REQUIRED_TABLES = [
  "customers",
  "accommodations",
  "bookings",
  "booking_items",
  "booking_events",
  "daily_cash_closures",
  "user_profiles",
] as const;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    console.error("Ensure .env.local is set up correctly.");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  let allOk = true;

  console.log("Verificando esquema en:", url);
  console.log("---");

  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("id").limit(0);

    if (error) {
      console.log(`  ✗ ${table} — ${error.message}`);
      allOk = false;
    } else {
      console.log(`  ✓ ${table}`);
    }
  }

  console.log("---");
  if (allOk) {
    console.log("Todas las tablas existen. Esquema OK.");
  } else {
    console.log("Faltan tablas. Ejecuta la migración desde el SQL Editor de Supabase.");
    console.log("Archivo: supabase/migrations/20260319_001_initial_schema.sql");
    process.exit(1);
  }
}

main();
