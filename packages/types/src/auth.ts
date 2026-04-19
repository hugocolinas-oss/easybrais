import type { User, Session } from "@supabase/supabase-js";
import type { StaffRole } from "./database";

export type AuthUser = User;
export type AuthSession = Session;

export type { StaffRole };

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  full_name: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
}
