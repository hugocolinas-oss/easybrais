import { cookies } from "next/headers";
import { createServerClient } from "@easybrais/utils/supabase/server";

export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // setAll can fail in Server Components (read-only context).
        // This is expected — session refresh will happen in middleware instead.
      }
    },
  });
}
