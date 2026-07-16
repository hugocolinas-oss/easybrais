import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { BrandRoutePattern } from "@/components/brand-route-pattern";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email, profile } = await requireAuth();

  const today = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        fullName={profile.full_name}
        email={email}
        role={profile.role}
      />

      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between overflow-hidden border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:px-8">
          <BrandRoutePattern className="absolute inset-y-0 right-0 hidden h-full w-[62%] opacity-45 sm:block" />
          <div className="relative flex items-center gap-3">
            <span className="text-base font-bold text-brand-700 lg:hidden">EB</span>
            <p className="text-sm font-medium text-gray-900 capitalize">{today}</p>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="hidden text-right text-xs text-gray-500 sm:block">
              <p className="font-medium text-gray-700">{profile.full_name || email}</p>
              <p>{profile.role}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {(profile.full_name || email).charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main content — pb-20 on mobile for bottom nav clearance */}
        <main className="flex-1 p-3 pb-20 sm:p-4 lg:p-8 lg:pb-8">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
