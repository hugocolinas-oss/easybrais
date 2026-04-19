import { getClosures, type ClosureFilters } from "@/lib/closure-queries";
import { GenerateClosureForm } from "@/components/cierres/generate-closure-form";
import { ClosureSummaryCard } from "@/components/cierres/closure-summary-card";
import { ClosureTable } from "@/components/cierres/closure-table";
import { ClosureDateFilter } from "@/components/cierres/closure-date-filter";

interface Props {
  searchParams: Promise<{ page?: string; dateFrom?: string; dateTo?: string }>;
}

export default async function CierresPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: ClosureFilters = {
    page: Math.max(1, Number(params.page) || 1),
    dateFrom: params.dateFrom ?? undefined,
    dateTo: params.dateTo ?? undefined,
  };

  const result = await getClosures(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cierres contables</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Hoja contable diaria — resumen de reservas, importes y cobros
        </p>
      </div>

      <GenerateClosureForm />

      <ClosureDateFilter dateFrom={filters.dateFrom ?? ""} dateTo={filters.dateTo ?? ""} />

      {result.rows.length > 0 && <ClosureSummaryCard summary={result.summary} />}

      <ClosureTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
      />
    </div>
  );
}
