import { requireAuth } from "@/lib/auth";
import { ensureBookingsAccess } from "@/lib/permissions";

export default async function BookingsLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();
  ensureBookingsAccess(profile.role);
  return children;
}
