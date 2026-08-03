/**
 * Single source of truth for booking status labels, colors, and ordering.
 */

export interface StatusConfig {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  dot: string;
}

export const STATUS_MAP: Record<string, StatusConfig> = {
  pending:          { label: "Confirmada",                shortLabel: "Confirmada",      bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500" },
  pending_payment:  { label: "Pendiente de pago",         shortLabel: "Pend. pago",      bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500" },
  confirmed:        { label: "Confirmada",                shortLabel: "Confirmada",      bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500" },
  in_pickup:        { label: "En recogida",               shortLabel: "Recogida",        bg: "bg-purple-100",  text: "text-purple-800",  dot: "bg-purple-500" },
  in_transit:       { label: "En tránsito",               shortLabel: "Tránsito",        bg: "bg-indigo-100",  text: "text-indigo-800",  dot: "bg-indigo-500" },
  delivered:        { label: "Entregada",                  shortLabel: "Entregada",       bg: "bg-green-100",   text: "text-green-800",   dot: "bg-green-500" },
  cancelled:        { label: "Cancelada",                  shortLabel: "Cancelada",       bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-500" },
  payment_expired:  { label: "Pago expirado",             shortLabel: "Pago expirado",   bg: "bg-orange-100",  text: "text-orange-800",  dot: "bg-orange-500" },
  incident:         { label: "Incidencia",                 shortLabel: "Incidencia",      bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-600" },
  draft:            { label: "Borrador",                   shortLabel: "Borrador",        bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400" },
  in_progress:      { label: "En curso",                   shortLabel: "En curso",        bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500" },
  completed:        { label: "Completada",                 shortLabel: "Completada",      bg: "bg-green-100",   text: "text-green-800",   dot: "bg-green-500" },
};

/** Statuses shown in filters and status-change dropdown. */
export const OPERATIONAL_STATUSES = [
  "confirmed",
  "in_pickup",
  "in_transit",
  "in_progress",
  "delivered",
  "completed",
  "incident",
  "cancelled",
] as const;

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_MAP[status] ?? { label: status, shortLabel: status, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
}
