export interface PaymentStatusConfig {
  label: string;
  cls: string;
}

export type PaymentCollectionBucket = "cash_pending" | "online_pending" | "settled";

export const PENDING_PAYMENT_STATUSES = new Set(["pending", "partial"]);

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const timestamp = new Date(expiresAt).getTime();
  return Number.isFinite(timestamp) && timestamp < Date.now();
}

export function isPaymentPending(paymentStatus: string | null | undefined): boolean {
  return !!paymentStatus && PENDING_PAYMENT_STATUSES.has(paymentStatus);
}

export function getPaymentCollectionBucket(
  paymentStatus: string | null | undefined,
  paymentMethod: string | null | undefined,
  sourceChannel?: string | null,
): PaymentCollectionBucket {
  if (!isPaymentPending(paymentStatus)) {
    return "settled";
  }

  if (paymentMethod === "cash") {
    return "cash_pending";
  }

  if (paymentMethod) {
    return "online_pending";
  }

  if (sourceChannel === "phone" || sourceChannel === "backoffice" || sourceChannel === "walk_in") {
    return "cash_pending";
  }

  return "online_pending";
}

export function getPaymentStatusConfig(
  paymentStatus: string | null | undefined,
  paymentExpiresAt?: string | null,
): PaymentStatusConfig {
  if (paymentStatus === "paid") {
    return { label: "Pagado", cls: "text-green-700 bg-green-50" };
  }

  if (paymentStatus === "refunded") {
    return { label: "Reembolsado", cls: "text-gray-600 bg-gray-100" };
  }

  if (paymentStatus === "partial") {
    return { label: "Parcial", cls: "text-orange-700 bg-orange-50" };
  }

  if (isExpired(paymentExpiresAt)) {
    return { label: "Pago expirado", cls: "text-gray-600 bg-gray-100" };
  }

  return { label: "Pago pendiente", cls: "text-amber-700 bg-amber-50" };
}
