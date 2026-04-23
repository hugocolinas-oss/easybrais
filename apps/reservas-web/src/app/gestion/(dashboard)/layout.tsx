import { requireAuth } from "@/lib/gestion/auth";
import { Sidebar } from "@/components/gestion/sidebar";
import { BottomNav } from "@/components/gestion/bottom-nav";

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
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-brand-700 md:hidden">EB</span>
            <p className="text-sm font-medium text-gray-900 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs text-gray-500 sm:block">
              <p className="font-medium text-gray-700">{profile.full_name || email}</p>
              <p>{profile.role}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {(profile.full_name || email).charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
