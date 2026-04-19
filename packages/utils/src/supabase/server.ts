import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import type { Database } from "@easybrais/types";
import type { CookieMethodsServer } from "./types";
import { getSupabaseConfig } from "./config";

/**
 * Creates a Supabase server client for use in Server Components,
 * Server Actions, and Route Handlers. Each app must provide its own
 * cookie adapter (via Next.js `cookies()`).
 *
 * Usage from each app:
 * ```ts
 * import { cookies } from "next/headers";
 * import { createServerClient } from "@easybrais/utils/supabase/server";
 *
 * export async function getServerSupabase() {
 *   const cookieStore = await cookies();
 *   return createServerClient({
 *     getAll: () => cookieStore.getAll(),
 *     setAll: (cookiesToSet) => {
 *       cookiesToSet.forEach(({ name, value, options }) =>
 *         cookieStore.set(name, value, options)
 *       );
 *     },
 *   });
 * }
 * ```
 */
export function createServerClient(cookieMethods: CookieMethodsServer) {
  const { url, anonKey } = getSupabaseConfig();

  return createSSRServerClient<Database>(url, anonKey, {
    cookies: cookieMethods,
  });
}
