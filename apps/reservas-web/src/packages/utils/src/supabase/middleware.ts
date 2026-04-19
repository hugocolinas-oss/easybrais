import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import type { Database } from "@easybrais/types";
import { getSupabaseConfig } from "./config";

interface MiddlewareRequest {
  cookies: {
    getAll: () => Array<{ name: string; value: string }>;
  };
}

interface MiddlewareResponse {
  cookies: {
    set: (
      name: string,
      value: string,
      options?: Record<string, unknown>
    ) => void;
  };
}

/**
 * Creates a Supabase client for use inside Next.js middleware.
 * Refreshes the auth session on every request so cookies stay valid.
 *
 * Returns { supabase, response } — the caller must return the response
 * so that refreshed cookies are sent to the browser.
 */
export function createMiddlewareClient(
  request: MiddlewareRequest,
  response: MiddlewareResponse
) {
  const { url, anonKey } = getSupabaseConfig();

  const supabase = createSSRServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}
