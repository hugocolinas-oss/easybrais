import { formatEUR } from "../pricing";

// ---------------------------------------------------------------------------
// HTML escaping — prevents XSS in email templates
// ---------------------------------------------------------------------------

const ESC_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => ESC_MAP[ch] ?? ch);
}

// ---------------------------------------------------------------------------
// Booking confirmation
// ---------------------------------------------------------------------------

export interface BookingConfirmationData {
  bookingCode: string;
  customerName: string;
  legs: Array<{
    serviceDate: string;
    pickupName: string;
    dropoffName: string;
    bagsCount: number;
    overweightBagsCount: number;
  }>;
  subtotalAmount: number;
  discountAmount: number;
  extraWeightAmount: number;
  totalAmount: number;
  customerNotes?: string | null;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function bookingConfirmationSubject(code: string): string {
  return `Easy Brais — Tu reserva ${code}`;
}

export function bookingConfirmationHtml(data: BookingConfirmationData): string {
  const legsHtml = data.legs
    .map(
      (leg, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${data.legs.length > 1 ? `Tramo ${i + 1}` : "Servicio"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${fmtDate(leg.serviceDate)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${escapeHtml(leg.pickupName)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${escapeHtml(leg.dropoffName)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;text-align:center;">${leg.bagsCount}${leg.overweightBagsCount > 0 ? ` (${leg.overweightBagsCount} +10kg)` : ""}</td>
      </tr>`,
    )
    .join("");

  const notesBlock = data.customerNotes
    ? `
    <div style="margin-top:20px;padding:12px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#92400e;"><strong>Tus observaciones:</strong></p>
      <p style="margin:6px 0 0;font-size:13px;color:#78350f;">${escapeHtml(data.customerNotes!)}</p>
    </div>`
    : "";

  const discountRow =
    data.discountAmount > 0
      ? `<tr>
          <td style="padding:6px 12px;color:#059669;font-size:13px;">Descuento volumen</td>
          <td style="padding:6px 12px;color:#059669;font-size:13px;text-align:right;">−${formatEUR(data.discountAmount)}</td>
        </tr>`
      : "";

  const extraRow =
    data.extraWeightAmount > 0
      ? `<tr>
          <td style="padding:6px 12px;color:#d97706;font-size:13px;">Suplemento sobrepeso</td>
          <td style="padding:6px 12px;color:#d97706;font-size:13px;text-align:right;">+${formatEUR(data.extraWeightAmount)}</td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#1e40af;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Easy Brais</h1>
            <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Transporte de equipaje — Camino Portugués</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hola <strong>${escapeHtml(data.customerName)}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;">
              Hemos recibido tu solicitud de reserva. La revisaremos y te confirmaremos lo antes posible.
            </p>

            <!-- Booking code -->
            <div style="text-align:center;padding:20px;background:#eff6ff;border-radius:8px;margin-bottom:24px;">
              <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Código de reserva</p>
              <p style="margin:6px 0 0;font-size:28px;font-weight:700;font-family:monospace;letter-spacing:3px;color:#1e40af;">${escapeHtml(data.bookingCode)}</p>
            </div>

            <!-- Legs table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;font-size:13px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;"></th>
                  <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Fecha</th>
                  <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Recogida</th>
                  <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Entrega</th>
                  <th style="padding:10px 12px;text-align:center;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Mochilas</th>
                </tr>
              </thead>
              <tbody>
                ${legsHtml}
              </tbody>
            </table>

            <!-- Pricing -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:14px;">
              <tr>
                <td style="padding:6px 12px;color:#6b7280;">Subtotal</td>
                <td style="padding:6px 12px;color:#374151;text-align:right;">${formatEUR(data.subtotalAmount)}</td>
              </tr>
              ${discountRow}
              ${extraRow}
              <tr style="border-top:2px solid #1e40af;">
                <td style="padding:10px 12px;font-weight:700;font-size:16px;color:#1e40af;">Total</td>
                <td style="padding:10px 12px;font-weight:700;font-size:16px;color:#1e40af;text-align:right;">${formatEUR(data.totalAmount)}</td>
              </tr>
            </table>

            ${notesBlock}

            <!-- Status note -->
            <div style="margin-top:24px;padding:12px 16px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;">
              <p style="margin:0;font-size:13px;color:#166534;">
                <strong>Estado:</strong> Pendiente de confirmación. Te enviaremos otro email cuando tu reserva esté confirmada.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              Easy Brais — Transporte de equipaje en el Camino Portugués<br>
              Este email es una confirmación automática. No respondas a este mensaje.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
