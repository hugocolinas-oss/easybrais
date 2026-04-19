import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import type { Database } from "@easybrais/types";
import { getSupabaseConfig } from "./config";

let browserClient: ReturnType<typeof createSSRBrowserClient<Database>> | null =
  null;

/**
 * Singleton browser client — safe to call from any client component.
 * Uses @supabase/ssr for automatic cookie-based session handling.
 */
export function createBrowserClient() {
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabaseConfig();

  browserClient = createSSRBrowserClient<Database>(url, anonKey);
  return browserClient;
}
