import { getDashboardStats, getRecentBookings } from "@/lib/gestion/queries";
import { KpiCard } from "@/components/gestion/dashboard/kpi-card";
import { RecentBookings } from "@/components/gestion/dashboard/recent-bookings";
import { DailySummary } from "@/components/gestion/dashboard/daily-summary";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, recentBookings] = await Promise.all([
    getDashboardStats(),
    getRecentBookings(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Vista general de operaciones — Easy Brais Beta
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Cobro pendiente"
          value={stats.pendingBookings}
          detail="Reservas con pago pendiente"
          color="amber"
          href="/gestion/reservas?paymentStatus=pending"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Hoy"
          value={stats.todayBookings}
          detail="Servicios programados"
          color="blue"
          href="/gestion/operativa"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        />
        <KpiCard
          label="Próximas"
          value={stats.upcomingBookings}
          detail="Reservas confirmadas/pendientes"
          color="green"
          href="/gestion/reservas"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
        <KpiCard
          label="Incidencias"
          value={stats.failedItems}
          detail={stats.failedItems === 0 ? "Sin incidencias" : "Items con estado fallido"}
          color={stats.failedItems > 0 ? "red" : "green"}
          href="/gestion/operativa"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      {/* Bottom row: Daily summary + Recent bookings */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[280px_1fr]">
        <DailySummary
          revenue={stats.todayRevenue}
          bookingsCount={stats.todayBookings}
          bagsCount={stats.todayBags}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Últimas reservas
            </h3>
            <span className="text-xs text-gray-400">
              {recentBookings.length} más recientes
            </span>
          </div>
          <RecentBookings bookings={recentBookings} />
        </div>
      </div>
    </div>
  );
}
