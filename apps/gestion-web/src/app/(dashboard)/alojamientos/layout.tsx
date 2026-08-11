import { requireAuth } from "@/lib/auth";
import { ensureAccommodationsAccess } from "@/lib/permissions";

export default async function AccommodationsLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();
  ensureAccommodationsAccess(profile.role);
  return children;
}
