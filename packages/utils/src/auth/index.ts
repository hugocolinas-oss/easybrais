import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiResult, AuthUser, SignInCredentials, SignUpCredentials, Database } from "@easybrais/types";

type Client = SupabaseClient<Database>;

export async function signIn(
  supabase: Client,
  { email, password }: SignInCredentials
): Promise<ApiResult<AuthUser>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } };
  }

  return { data: data.user, error: null };
}

export async function signUp(
  supabase: Client,
  { email, password, fullName }: SignUpCredentials
): Promise<ApiResult<AuthUser>> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } };
  }

  if (!data.user) {
    return { data: null, error: { message: "No user returned after sign up" } };
  }

  return { data: data.user, error: null };
}

export async function signOut(supabase: Client): Promise<ApiResult<null>> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } };
  }

  return { data: null, error: null };
}

export async function getUser(
  supabase: Client
): Promise<ApiResult<AuthUser>> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } };
  }

  return { data: data.user, error: null };
}

export async function getSession(supabase: Client) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } };
  }

  return { data: data.session, error: null };
}
