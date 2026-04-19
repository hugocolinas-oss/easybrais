import type { OperativeSummary } from "@/lib/gestion/operative-queries";

interface Props {
  summary: OperativeSummary;
}

const COUNTERS: {
  key: keyof OperativeSummary;
  label: string;
  dot: string;
  bg: string;
}[] = [
  { key: "pending", label: "Pendientes", dot: "bg-amber-500", bg: "bg-amber-50" },
  { key: "picked_up", label: "Recogidos", dot: "bg-purple-500", bg: "bg-purple-50" },
  { key: "delivered", label: "Entregados", dot: "bg-green-500", bg: "bg-green-50" },
  { key: "incident", label: "Incidencias", dot: "bg-red-500", bg: "bg-red-50" },
];

export function StatusCounters({ summary }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
      {/* Total */}
      <div className="col-span-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:col-span-1 sm:p-4">
        <p className="text-[10px] font-medium text-gray-500 sm:text-xs">Total servicios</p>
        <div className="mt-0.5 flex items-baseline gap-2 sm:mt-1">
          <span className="text-xl font-bold text-gray-900 sm:text-2xl">{summary.total}</span>
          <span className="text-[10px] text-gray-400 sm:text-xs">{summary.total_bags} mochilas</span>
        </div>
      </div>

      {COUNTERS.map((c) => {
        const count = summary[c.key] as number;
        return (
          <div
            key={c.key}
            className={`rounded-lg border border-gray-200 p-2.5 shadow-sm sm:p-4 ${count > 0 ? c.bg : "bg-white"}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${c.dot}`} />
              <p className="text-[10px] font-medium text-gray-500 sm:text-xs">{c.label}</p>
            </div>
            <p className="mt-0.5 text-xl font-bold text-gray-900 sm:mt-1 sm:text-2xl">{count}</p>
          </div>
        );
      })}
    </div>
  );
}
