import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import type { UserProfile, StaffRole } from "@easybrais/types";

interface ProfileRow {
  id: string;
  auth_user_id: string;
  full_name: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
}

/**
 * Gets the authenticated user and their profile.
 * Redirects to /login if not authenticated or profile is inactive.
 */
export async function requireAuth(): Promise<{
  userId: string;
  email: string;
  profile: UserProfile;
}> {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/gestion/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, auth_user_id, full_name, role, active, created_at")
    .eq("auth_user_id", user.id)
    .single<ProfileRow>();

  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    redirect("/gestion/login?error=inactive");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    profile,
  };
}

/**
 * Gets the profile for the current user without redirecting.
 * Returns null if not authenticated or no profile found.
 */
export async function getOptionalProfile(): Promise<UserProfile | null> {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, auth_user_id, full_name, role, active, created_at")
    .eq("auth_user_id", user.id)
    .single<ProfileRow>();

  return profile ?? null;
}
