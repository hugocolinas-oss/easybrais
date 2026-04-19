export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
    </div>
  );
}
