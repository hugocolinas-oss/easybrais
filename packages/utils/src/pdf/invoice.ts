import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { embedBrandLogo } from "./logo";

export interface InvoiceLeg {
  serviceDate: string;
  pickupName: string;
  dropoffName: string;
  bagsCount: number;
  overweightBagsCount: number;
}

export interface InvoiceData {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  legs: InvoiceLeg[];
  subtotalAmount: number;
  discountAmount: number;
  extraWeightAmount: number;
  totalAmount: number;
  customerNotes?: string | null;
}

function fmtDate(iso: string): string {
  if (!iso || iso.length < 10) return iso ?? "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function eur(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} EUR`;
}

/**
 * Generate a booking invoice/proforma PDF.
 * Returns a Uint8Array (PDF bytes) ready to attach to an email or save.
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const logo = await embedBrandLogo(doc);

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const brandGreen = rgb(0.12, 0.31, 0.20);
  const gold = rgb(0.71, 0.55, 0.16);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const medGray = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.85, 0.85, 0.85);
  const white = rgb(1, 1, 1);

  const marginL = 50;
  const marginR = 50;
  const contentW = width - marginL - marginR;

  // ---------- Header bar ----------
  page.drawRectangle({
    x: 0, y: height - 108, width, height: 108,
    color: brandGreen,
  });

  if (logo) {
    page.drawImage(logo, {
      x: marginL,
      y: height - 92,
      width: 38,
      height: 38,
    });
  }

  page.drawText("Easy Brais", {
    x: marginL + (logo ? 50 : 0), y: height - 46,
    size: 24, font: fontBold, color: white,
  });
  page.drawText("Comprobante de reserva", {
    x: marginL + (logo ? 50 : 0), y: height - 64,
    size: 11, font: fontBold, color: gold,
  });
  page.drawText("Transporte de mochilas no Camino Portugues", {
    x: marginL + (logo ? 50 : 0), y: height - 79,
    size: 9, font: fontRegular, color: rgb(0.7, 0.85, 0.75),
  });

  page.drawText("Reserva", {
    x: width - marginR - fontBold.widthOfTextAtSize("Reserva", 12),
    y: height - 42,
    size: 12, font: fontBold, color: gold,
  });
  page.drawText(data.bookingCode, {
    x: width - marginR - fontBold.widthOfTextAtSize(data.bookingCode, 16),
    y: height - 63,
    size: 16, font: fontBold, color: white,
  });

  // ---------- Customer info ----------
  let y = height - 142;

  page.drawText("DATOS DE LA RESERVA", {
    x: marginL, y, size: 9, font: fontBold, color: medGray,
  });
  y -= 16;

  page.drawText(data.customerName, {
    x: marginL, y, size: 11, font: fontBold, color: darkGray,
  });
  y -= 14;
  page.drawText(data.customerEmail, {
    x: marginL, y, size: 9, font: fontRegular, color: medGray,
  });
  y -= 14;

  // Booking code + date on right
  const firstDate = data.legs[0]?.serviceDate
    ? fmtDate(data.legs[0].serviceDate)
    : "—";
  page.drawText(`Fecha servicio: ${firstDate}`, {
    x: width - marginR - fontRegular.widthOfTextAtSize(`Fecha servicio: ${firstDate}`, 9),
    y: height - 142,
    size: 9, font: fontRegular, color: medGray,
  });
  page.drawText("Documento de comprobacion", {
    x: width - marginR - fontRegular.widthOfTextAtSize("Documento de comprobacion", 9),
    y: height - 156,
    size: 9, font: fontRegular, color: medGray,
  });

  // ---------- Legs table ----------
  y -= 20;
  page.drawText("DETALLE DEL SERVICIO", {
    x: marginL, y, size: 9, font: fontBold, color: medGray,
  });
  y -= 6;
  page.drawLine({
    start: { x: marginL, y },
    end: { x: width - marginR, y },
    thickness: 0.5, color: lightGray,
  });
  y -= 18;

  // Table header
  const col = { leg: marginL, date: marginL + 70, pickup: marginL + 140, dropoff: marginL + 280, bags: width - marginR - 30 };

  page.drawText("Tramo", { x: col.leg, y, size: 8, font: fontBold, color: medGray });
  page.drawText("Fecha", { x: col.date, y, size: 8, font: fontBold, color: medGray });
  page.drawText("Recogida", { x: col.pickup, y, size: 8, font: fontBold, color: medGray });
  page.drawText("Entrega", { x: col.dropoff, y, size: 8, font: fontBold, color: medGray });
  page.drawText("Uds.", { x: col.bags, y, size: 8, font: fontBold, color: medGray });

  y -= 6;
  page.drawLine({
    start: { x: marginL, y },
    end: { x: width - marginR, y },
    thickness: 0.5, color: lightGray,
  });
  y -= 16;

  for (let i = 0; i < data.legs.length; i++) {
    const leg = data.legs[i]!;
    const label = data.legs.length > 1 ? `Tramo ${i + 1}` : "Servicio";

    // Stripe background for even rows
    if (i % 2 === 0) {
      page.drawRectangle({
        x: marginL - 4, y: y - 4, width: contentW + 8, height: 18,
        color: rgb(0.97, 0.97, 0.97),
      });
    }

    page.drawText(label, { x: col.leg, y, size: 9, font: fontRegular, color: darkGray });
    page.drawText(fmtDate(leg.serviceDate), { x: col.date, y, size: 9, font: fontRegular, color: darkGray });

    const pickupTrunc = leg.pickupName.length > 22 ? leg.pickupName.slice(0, 20) + "..." : leg.pickupName;
    const dropoffTrunc = leg.dropoffName.length > 22 ? leg.dropoffName.slice(0, 20) + "..." : leg.dropoffName;

    page.drawText(pickupTrunc, { x: col.pickup, y, size: 9, font: fontRegular, color: darkGray });
    page.drawText(dropoffTrunc, { x: col.dropoff, y, size: 9, font: fontRegular, color: darkGray });

    let bagsText = String(leg.bagsCount);
    if (leg.overweightBagsCount > 0) {
      bagsText += ` (+${leg.overweightBagsCount})`;
    }
    page.drawText(bagsText, { x: col.bags, y, size: 9, font: fontRegular, color: darkGray });

    y -= 20;
  }

  // ---------- Pricing ----------
  y -= 10;
  page.drawLine({
    start: { x: marginL, y },
    end: { x: width - marginR, y },
    thickness: 0.5, color: lightGray,
  });
  y -= 20;

  const priceX = width - marginR;
  const labelX = priceX - 160;

  function priceLine(label: string, amount: string, opts?: { bold?: boolean; color?: typeof darkGray }) {
    page.drawText(label, {
      x: labelX, y, size: 10,
      font: opts?.bold ? fontBold : fontRegular,
      color: opts?.color ?? medGray,
    });
    page.drawText(amount, {
      x: priceX - fontBold.widthOfTextAtSize(amount, opts?.bold ? 12 : 10),
      y, size: opts?.bold ? 12 : 10,
      font: opts?.bold ? fontBold : fontRegular,
      color: opts?.color ?? darkGray,
    });
    y -= 18;
  }

  priceLine("Subtotal", eur(data.subtotalAmount));

  if (data.discountAmount > 0) {
    priceLine("Descuento volumen", `-${eur(data.discountAmount)}`, { color: rgb(0.02, 0.59, 0.24) });
  }
  if (data.extraWeightAmount > 0) {
    priceLine("Suplemento sobrepeso", `+${eur(data.extraWeightAmount)}`, { color: rgb(0.85, 0.47, 0.02) });
  }

  y -= 4;
  page.drawLine({
    start: { x: labelX, y: y + 8 },
    end: { x: priceX, y: y + 8 },
    thickness: 1.5, color: brandGreen,
  });
  y -= 6;

  priceLine("TOTAL", eur(data.totalAmount), { bold: true, color: brandGreen });

  // ---------- Notes ----------
  if (data.customerNotes) {
    y -= 10;
    page.drawText("OBSERVACIONES", {
      x: marginL, y, size: 9, font: fontBold, color: medGray,
    });
    y -= 14;
    const notesTrunc = data.customerNotes.length > 200
      ? data.customerNotes.slice(0, 197) + "..."
      : data.customerNotes;
    page.drawText(notesTrunc, {
      x: marginL, y, size: 9, font: fontRegular, color: darkGray, maxWidth: contentW,
    });
  }

  // ---------- Status box ----------
  y -= 30;
  page.drawRectangle({
    x: marginL, y: y - 12, width: contentW, height: 40,
    color: rgb(0.97, 0.95, 0.90), borderColor: gold, borderWidth: 0.7,
  });
  page.drawText("Comprobante emitido correctamente.", {
    x: marginL + 10, y: y + 10, size: 10, font: fontBold, color: brandGreen,
  });
  page.drawText("Guarda este PDF como justificante de tu reserva. Si necesitas cambios, responde al correo recibido.", {
    x: marginL + 10, y: y - 2, size: 8.5, font: fontRegular, color: darkGray, maxWidth: contentW - 20,
  });

  // ---------- Footer ----------
  page.drawText(
    "Easy Brais — reservas.easybrais.es",
    {
      x: width / 2 - fontRegular.widthOfTextAtSize("Easy Brais — reservas.easybrais.es", 7) / 2,
      y: 30,
      size: 7, font: fontRegular, color: medGray,
    },
  );
  page.drawText("Documento de reserva — No constituye factura fiscal", {
    x: width / 2 - fontRegular.widthOfTextAtSize("Documento de reserva — No constituye factura fiscal", 7) / 2,
    y: 20,
    size: 7, font: fontRegular, color: lightGray,
  });

  return doc.save();
}
