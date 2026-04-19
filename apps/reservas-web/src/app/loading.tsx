export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cream-300 border-t-brand-900" />
        <p className="text-sm font-medium text-brand-800/40">Cargando...</p>
      </div>
    </div>
  );
}
