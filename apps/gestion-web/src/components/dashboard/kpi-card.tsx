import Link from "next/link";

interface Props {
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "red";
  href?: string;
}

const COLORS = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    value: "text-blue-900",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    value: "text-green-900",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    value: "text-amber-900",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    value: "text-red-900",
  },
};

export function KpiCard({ label, value, detail, icon, color, href }: Props) {
  const c = COLORS[color];

  const content = (
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
          {label}
        </p>
        <p className={`mt-1 text-xl font-bold sm:mt-2 sm:text-2xl ${c.value}`}>{value}</p>
        {detail && (
          <p className="mt-0.5 truncate text-[10px] text-gray-400 sm:mt-1 sm:text-xs">{detail}</p>
        )}
      </div>
      <div className={`shrink-0 rounded-lg ${c.bg} p-2 sm:p-2.5`}>
        <div className={c.icon}>{icon}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md sm:p-5"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-5">
      {content}
    </div>
  );
}
