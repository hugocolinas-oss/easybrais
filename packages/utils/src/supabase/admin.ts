import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@easybrais/types";
import { getSupabaseServiceConfig } from "./config";

/**
 * Admin client with service_role key — bypasses RLS.
 * ONLY use in trusted server-side contexts (Server Actions, API routes, scripts).
 * Never expose to the browser.
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServiceConfig();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
