import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** Prevent open-redirect: only allow relative paths that don't escape the origin. */
function safePath(raw: string | null): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return "/";
  }
  return trimmed;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safePath(searchParams.get("next"));

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
