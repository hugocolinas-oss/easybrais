export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** DD/MM/YYYY — compact date for tables and lists. */
export function fmtDateShort(iso: string): string {
  if (!iso || iso.length < 10) return iso ?? "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatTime(time: string): string {
  if (!time || !time.includes(":")) return time ?? "—";
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
}
