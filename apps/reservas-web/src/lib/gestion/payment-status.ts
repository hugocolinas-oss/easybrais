export interface PaymentStatusConfig {
  label: string;
  cls: string;
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const timestamp = new Date(expiresAt).getTime();
  return Number.isFinite(timestamp) && timestamp < Date.now();
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
