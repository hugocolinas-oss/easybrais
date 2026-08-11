import { requireAuth } from "@/lib/auth";
import { ensureClosuresAccess } from "@/lib/permissions";

export default async function ClosuresLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();
  ensureClosuresAccess(profile.role);
  return children;
}
