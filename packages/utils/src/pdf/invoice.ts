import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
    x: 0, y: height - 80, width, height: 80,
    color: brandGreen,
  });

  page.drawText("Easy Brais", {
    x: marginL, y: height - 35,
    size: 22, font: fontBold, color: white,
  });
  page.drawText("Transporte de equipaje — Camino Portugues", {
    x: marginL, y: height - 52,
    size: 9, font: fontRegular, color: rgb(0.7, 0.85, 0.75),
  });

  // Invoice label
  page.drawText("PROFORMA", {
    x: width - marginR - fontBold.widthOfTextAtSize("PROFORMA", 14),
    y: height - 35,
    size: 14, font: fontBold, color: gold,
  });
  page.drawText(data.bookingCode, {
    x: width - marginR - fontBold.widthOfTextAtSize(data.bookingCode, 11),
    y: height - 52,
    size: 11, font: fontBold, color: white,
  });

  // ---------- Customer info ----------
  let y = height - 110;

  page.drawText("DATOS DEL CLIENTE", {
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
  y -= 10;

  // Booking code + date on right
  const firstDate = data.legs[0]?.serviceDate
    ? fmtDate(data.legs[0].serviceDate)
    : "—";
  page.drawText(`Fecha servicio: ${firstDate}`, {
    x: width - marginR - fontRegular.widthOfTextAtSize(`Fecha servicio: ${firstDate}`, 9),
    y: height - 110,
    size: 9, font: fontRegular, color: medGray,
  });

  // ---------- Legs table ----------
  y -= 20;
  page.drawText("DETALLE DE SERVICIOS", {
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
    x: marginL, y: y - 8, width: contentW, height: 28,
    color: rgb(0.94, 0.99, 0.95), borderColor: rgb(0.13, 0.77, 0.35), borderWidth: 0.5,
  });
  page.drawText("Estado: Pendiente de confirmacion — Te confirmaremos lo antes posible.", {
    x: marginL + 10, y: y + 2, size: 9, font: fontRegular, color: rgb(0.09, 0.39, 0.2),
  });

  // ---------- Footer ----------
  page.drawText(
    "Easy Brais — Transporte de equipaje en el Camino Portugues — www.easybrais.es",
    {
      x: width / 2 - fontRegular.widthOfTextAtSize("Easy Brais — Transporte de equipaje en el Camino Portugues — www.easybrais.es", 7) / 2,
      y: 30,
      size: 7, font: fontRegular, color: medGray,
    },
  );
  page.drawText("Documento proforma — No constituye factura fiscal", {
    x: width / 2 - fontRegular.widthOfTextAtSize("Documento proforma — No constituye factura fiscal", 7) / 2,
    y: 20,
    size: 7, font: fontRegular, color: lightGray,
  });

  return doc.save();
}
