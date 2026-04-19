import { formatEUR } from "@easybrais/utils";

interface Props {
  revenue: number;
  bookingsCount: number;
  bagsCount: number;
}

export function DailySummary({ revenue, bookingsCount, bagsCount }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-5">
      <h3 className="text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
        Facturación del día
      </h3>

      <p className="mt-2 text-2xl font-bold text-gray-900 sm:mt-3 sm:text-3xl">
        {formatEUR(revenue)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 sm:mt-4 sm:gap-4 sm:pt-4">
        <div>
          <p className="text-[10px] text-gray-400 sm:text-xs">Reservas</p>
          <p className="text-base font-semibold text-gray-700 sm:text-lg">{bookingsCount}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 sm:text-xs">Mochilas</p>
          <p className="text-base font-semibold text-gray-700 sm:text-lg">{bagsCount}</p>
        </div>
      </div>
    </div>
  );
}
