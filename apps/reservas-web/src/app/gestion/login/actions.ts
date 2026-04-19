"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }

  const supabase = await getServerSupabase();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Credenciales incorrectas. Inténtalo de nuevo." };
  }

  redirect("/gestion");
}
