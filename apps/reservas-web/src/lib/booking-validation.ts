import type { BookingFormData } from "@/lib/types";
import { isPhoneValueValid, normalizePhoneValue } from "@/lib/phone";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LEGS = 10;
const MAX_BAGS_PER_LEG = 50;

function isCalendarDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isBookablePublicDate(value: string): boolean {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const requested = Date.parse(`${value}T00:00:00Z`);
  const latest = new Date(todayUtc);
  latest.setUTCFullYear(latest.getUTCFullYear() + 2);
  return requested >= todayUtc && requested <= latest.getTime();
}

export function validateBookingRequest(
  data: BookingFormData | null | undefined,
  idempotencyKey: string,
): string | null {
  if (!data || typeof data !== "object" || !data.customer || !Array.isArray(data.legs))
    return "Solicitud inválida.";
  if (!data.customer.fullName?.trim()) return "El nombre es obligatorio.";
  if (data.customer.fullName.length > 120) return "El nombre es demasiado largo.";
  if (!data.customer.email?.trim()) return "El email es obligatorio.";
  if (data.customer.email.length > 254) return "El email es demasiado largo.";
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(data.customer.email))
    return "El email no es válido.";
  const normalizedPhone = normalizePhoneValue(data.customer.phone ?? "");
  if (!normalizedPhone) return "El teléfono es obligatorio.";
  if (!isPhoneValueValid(normalizedPhone)) return "El teléfono no es válido.";
  if (normalizedPhone.length > 30) return "El teléfono es demasiado largo.";
  if (data.customer.notes && data.customer.notes.length > 500)
    return "Las observaciones son demasiado largas.";
  if (!data.legs.length) return "Debes añadir al menos un tramo.";
  if (data.legs.length > MAX_LEGS)
    return `No se permiten más de ${MAX_LEGS} tramos por reserva.`;

  for (const [i, leg] of data.legs.entries()) {
    if (!isCalendarDate(leg.serviceDate))
      return `Tramo ${i + 1}: la fecha de servicio no es válida.`;
    if (!UUID_RE.test(leg.pickupAccommodationId))
      return `Tramo ${i + 1}: falta el alojamiento de recogida.`;
    if (!UUID_RE.test(leg.dropoffAccommodationId))
      return `Tramo ${i + 1}: falta el alojamiento de entrega.`;
    if (leg.pickupAccommodationId === leg.dropoffAccommodationId)
      return `Tramo ${i + 1}: recogida y entrega deben ser distintos.`;
    if (!Number.isInteger(leg.bagsCount) || leg.bagsCount < 1 || leg.bagsCount > MAX_BAGS_PER_LEG)
      return `Tramo ${i + 1}: el número de mochilas no es válido.`;
    if (
      !Number.isInteger(leg.overweightBagsCount)
      || leg.overweightBagsCount < 0
      || leg.overweightBagsCount > leg.bagsCount
    ) return `Tramo ${i + 1}: el número de mochilas con sobrepeso no es válido.`;
  }

  if (!UUID_RE.test(idempotencyKey?.trim() ?? "")) return "Solicitud inválida.";
  return null;
}

export function validatePublicBookingRequest(data: BookingFormData): string | null {
  if (data.accommodationPolicyAccepted !== true)
    return "Debes confirmar que tienes una reserva a tu nombre o que has elegido una consigna.";
  if (data.legs.some((leg) => !isBookablePublicDate(leg.serviceDate)))
    return "La fecha debe estar entre hoy y los próximos dos años.";
  return null;
}
