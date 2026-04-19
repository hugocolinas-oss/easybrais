import { getStatusConfig } from "@/lib/gestion/booking-status";

export function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const cfg = getStatusConfig(status);
  const cls = size === "lg"
    ? `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`
    : `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`;

  return (
    <span className={cls}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {size === "lg" ? cfg.label : cfg.shortLabel}
    </span>
  );
}
