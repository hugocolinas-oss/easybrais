"use client";

import { createBrowserClient } from "@easybrais/utils/supabase/client";

export function getClientSupabase() {
  return createBrowserClient();
}
