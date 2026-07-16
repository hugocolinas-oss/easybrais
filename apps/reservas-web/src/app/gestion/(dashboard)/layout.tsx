import Image from "next/image";
import { requireAuth } from "@/lib/gestion/auth";
import { Sidebar } from "@/components/gestion/sidebar";
import { BottomNav } from "@/components/gestion/bottom-nav";
import { BrandRoutePattern } from "@/components/brand-route-pattern";
import { BRAND_LOGO_SRC } from "@/lib/brand";

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
    <div className="flex min-h-screen bg-cream-100">
      <Sidebar
        fullName={profile.full_name}
        email={email}
        role={profile.role}
      />

      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between overflow-hidden border-b border-brand-900/10 bg-white/95 px-4 py-3 backdrop-blur-sm md:px-6">
          <BrandRoutePattern className="absolute inset-y-0 right-0 hidden h-full w-[62%] opacity-45 sm:block" />
          <div className="relative flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-brand-900/10 md:hidden">
              <Image src={BRAND_LOGO_SRC} alt="Easy Brais" fill className="object-contain" sizes="36px" />
            </div>
            <p className="text-sm font-medium capitalize text-brand-900">{today}</p>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="hidden text-right text-xs text-brand-800/50 sm:block">
              <p className="font-medium text-brand-900">{profile.full_name || email}</p>
              <p>{profile.role}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
              {(profile.full_name || email).charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6">{children}</main>
      </div>

      <BottomNav role={profile.role} />
    </div>
  );
}
