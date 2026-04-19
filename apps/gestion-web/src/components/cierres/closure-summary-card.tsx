import type { ClosureSummary } from "@/lib/closure-queries";

interface Props {
  summary: ClosureSummary;
}

function eur(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function ClosureSummaryCard({ summary }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Resumen del período ({summary.count} {summary.count === 1 ? "día" : "días"})
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Reservas" value={String(summary.totalBookings)} />
        <Metric label="Mochilas" value={String(summary.totalBags)} />
        <Metric label="Bruto total" value={eur(summary.totalGross)} />
        <Metric label="Neto total" value={eur(summary.totalNet)} color="text-green-700" />
        <Metric label="Media/día" value={eur(summary.avgNetPerDay)} />
        <Metric label="Descuentos" value={summary.totalDiscounts > 0 ? `−${eur(summary.totalDiscounts)}` : "—"} color="text-green-600" />
        <Metric label="Extras" value={summary.totalExtras > 0 ? `+${eur(summary.totalExtras)}` : "—"} color="text-amber-600" />
        <Metric
          label="Pendiente cobro"
          value={summary.totalPending > 0 ? eur(summary.totalPending) : "0 €"}
          color={summary.totalPending > 0 ? "text-amber-600" : "text-green-600"}
        />
        <Metric
          label="Cancelaciones"
          value={String(summary.totalCancellations)}
          color={summary.totalCancellations > 0 ? "text-red-600" : "text-gray-500"}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className={`text-lg font-bold ${color ?? "text-gray-900"}`}>{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  );
}
