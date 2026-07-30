export async function openStripeCheckout(bookingId: string, bookingCode: string): Promise<void> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, bookingCode }),
  });
  const payload = await response.json() as { url?: string; error?: string };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "No se ha podido abrir el pago seguro.");
  }

  window.location.assign(payload.url);
}
