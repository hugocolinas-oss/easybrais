interface Props {
  reason: string;
  compact?: boolean;
}

export function IncidentFlag({ reason, compact = false }: Props) {
  const baseClass = compact
    ? "inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700"
    : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800";

  return (
    <div className={baseClass} title={reason}>
      <span className="shrink-0">⚠</span>
      <span className={compact ? "truncate max-w-[220px]" : "block whitespace-pre-line"}>
        {compact ? `Incidencia: ${reason}` : reason}
      </span>
    </div>
  );
}
