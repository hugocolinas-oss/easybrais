import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

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

const PAGE_SIZE: [number, number] = [595, 842];
const MARGIN_L = 50;
const MARGIN_R = 50;
const CONTENT_W = PAGE_SIZE[0] - MARGIN_L - MARGIN_R;

const COLLECTION_STEPS = [
  "1. Localiza tu sobre de EasyBrais en tu alojamiento.",
  "2. Cubre los datos en el anverso. Si sois un grupo, cada mochila debe llevar un sobre, pero en todos debe constar el nombre de la persona que reserve.",
  "3. Deposita el importe en metalico en el interior y cierralo bien. O paga con tarjeta mediante enlace: pidenoslo y te lo pasamos.",
  "4. Deja el sobre metido en un bolsillo visible o atado a la mochila. Nosotros lo recogeremos junto con tu equipaje.",
];

const COLLECTION_POSTSCRIPT =
  "PD: Si no encuentras un sobre en el albergue, es probable que se hayan agotado. En ese caso, coge un papel y escribe EasyBrais, tu nombre y apellidos, direccion destino y telefono. Doblarlo, deja el dinero en el interior y ponlo en un bolsillo visible de la mochila.";

function fmtDate(iso: string): string {
  if (!iso || iso.length < 10) return iso ?? "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function eur(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} EUR`;
}

function wrapText(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function drawParagraph(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  lineHeight = size + 3,
): number {
  const lines = wrapText(text, maxWidth, font, size);
  let cursor = y;

  for (const line of lines) {
    page.drawText(line, { x, y: cursor, size, font, color, maxWidth });
    cursor -= lineHeight;
  }

  return cursor;
}

function drawHeader(
  page: PDFPage,
  fontRegular: PDFFont,
  fontBold: PDFFont,
  bookingCode: string,
  title: string,
  subtitle: string,
) {
  const { width, height } = page.getSize();
  const brandGreen = rgb(0.12, 0.31, 0.2);
  const gold = rgb(0.71, 0.55, 0.16);
  const white = rgb(1, 1, 1);
  const paleGreen = rgb(0.7, 0.85, 0.75);

  page.drawRectangle({
    x: 0,
    y: height - 122,
    width,
    height: 122,
    color: brandGreen,
  });

  page.drawRectangle({
    x: 0,
    y: height - 132,
    width,
    height: 10,
    color: gold,
  });

  page.drawText("Easy Brais", {
    x: MARGIN_L,
    y: height - 50,
    size: 24,
    font: fontBold,
    color: white,
  });

  page.drawText(title, {
    x: MARGIN_L,
    y: height - 70,
    size: 11,
    font: fontBold,
    color: gold,
  });

  page.drawText(subtitle, {
    x: MARGIN_L,
    y: height - 87,
    size: 9,
    font: fontRegular,
    color: paleGreen,
  });

  page.drawText(bookingCode, {
    x: width - MARGIN_R - fontBold.widthOfTextAtSize(bookingCode, 17),
    y: height - 104,
    size: 17,
    font: fontBold,
    color: white,
  });
}

/**
 * Generate a booking PDF.
 * Returns a Uint8Array (PDF bytes) ready to attach to an email or save.
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const brandGreen = rgb(0.12, 0.31, 0.2);
  const gold = rgb(0.71, 0.55, 0.16);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const medGray = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.85, 0.85, 0.85);
  const stripeGray = rgb(0.97, 0.97, 0.97);
  const cream = rgb(0.97, 0.95, 0.9);
  const white = rgb(1, 1, 1);

  const page = doc.addPage(PAGE_SIZE);
  const { width, height } = page.getSize();
  drawHeader(
    page,
    fontRegular,
    fontBold,
    data.bookingCode,
    "Reserva confirmada",
    "Transporte de mochilas no Camino Portugues",
  );

  const badgeWidth = 124;
  const badgeHeight = 32;
  const badgeX = width - MARGIN_R - badgeWidth;
  const badgeY = height - 72;

  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: white,
    opacity: 0.12,
    borderColor: white,
    borderWidth: 0.8,
  });

  page.drawText("CONFIRMADA", {
    x: badgeX + (badgeWidth - fontBold.widthOfTextAtSize("CONFIRMADA", 11)) / 2,
    y: badgeY + 11,
    size: 11,
    font: fontBold,
    color: white,
  });

  let y = height - 166;
  page.drawText("DATOS DE LA RESERVA", {
    x: MARGIN_L,
    y,
    size: 9,
    font: fontBold,
    color: medGray,
  });

  y -= 16;
  page.drawText(data.customerName, {
    x: MARGIN_L,
    y,
    size: 11,
    font: fontBold,
    color: darkGray,
  });

  y -= 14;
  page.drawText(data.customerEmail, {
    x: MARGIN_L,
    y,
    size: 9,
    font: fontRegular,
    color: medGray,
  });

  const firstDate = data.legs[0]?.serviceDate ? fmtDate(data.legs[0].serviceDate) : "-";
  page.drawText(`Fecha servicio: ${firstDate}`, {
    x: width - MARGIN_R - fontRegular.widthOfTextAtSize(`Fecha servicio: ${firstDate}`, 9),
    y: height - 166,
    size: 9,
    font: fontRegular,
    color: medGray,
  });

  page.drawText("Estado: Confirmada", {
    x: width - MARGIN_R - fontBold.widthOfTextAtSize("Estado: Confirmada", 9),
    y: height - 180,
    size: 9,
    font: fontBold,
    color: brandGreen,
  });

  y -= 34;
  page.drawText("DETALLE DEL SERVICIO", {
    x: MARGIN_L,
    y,
    size: 9,
    font: fontBold,
    color: medGray,
  });

  y -= 6;
  page.drawLine({
    start: { x: MARGIN_L, y },
    end: { x: width - MARGIN_R, y },
    thickness: 0.5,
    color: lightGray,
  });

  y -= 18;
  const col = {
    leg: MARGIN_L,
    date: MARGIN_L + 70,
    pickup: MARGIN_L + 140,
    dropoff: MARGIN_L + 280,
    bags: width - MARGIN_R - 30,
  };

  page.drawText("Tramo", { x: col.leg, y, size: 8, font: fontBold, color: medGray });
  page.drawText("Fecha", { x: col.date, y, size: 8, font: fontBold, color: medGray });
  page.drawText("Recogida", { x: col.pickup, y, size: 8, font: fontBold, color: medGray });
  page.drawText("Entrega", { x: col.dropoff, y, size: 8, font: fontBold, color: medGray });
  page.drawText("Uds.", { x: col.bags, y, size: 8, font: fontBold, color: medGray });

  y -= 6;
  page.drawLine({
    start: { x: MARGIN_L, y },
    end: { x: width - MARGIN_R, y },
    thickness: 0.5,
    color: lightGray,
  });

  y -= 16;
  for (let i = 0; i < data.legs.length; i += 1) {
    const leg = data.legs[i]!;
    const label = data.legs.length > 1 ? `Tramo ${i + 1}` : "Servicio";

    if (i % 2 === 0) {
      page.drawRectangle({
        x: MARGIN_L - 4,
        y: y - 4,
        width: CONTENT_W + 8,
        height: 18,
        color: stripeGray,
      });
    }

    const pickupTrunc = leg.pickupName.length > 22 ? `${leg.pickupName.slice(0, 20)}...` : leg.pickupName;
    const dropoffTrunc = leg.dropoffName.length > 22 ? `${leg.dropoffName.slice(0, 20)}...` : leg.dropoffName;

    page.drawText(label, { x: col.leg, y, size: 9, font: fontRegular, color: darkGray });
    page.drawText(fmtDate(leg.serviceDate), { x: col.date, y, size: 9, font: fontRegular, color: darkGray });
    page.drawText(pickupTrunc, { x: col.pickup, y, size: 9, font: fontRegular, color: darkGray });
    page.drawText(dropoffTrunc, { x: col.dropoff, y, size: 9, font: fontRegular, color: darkGray });

    const bagsText = leg.overweightBagsCount > 0
      ? `${leg.bagsCount} (+${leg.overweightBagsCount})`
      : String(leg.bagsCount);
    page.drawText(bagsText, { x: col.bags, y, size: 9, font: fontRegular, color: darkGray });

    y -= 20;
  }

  y -= 10;
  page.drawLine({
    start: { x: MARGIN_L, y },
    end: { x: width - MARGIN_R, y },
    thickness: 0.5,
    color: lightGray,
  });

  y -= 20;
  const priceX = width - MARGIN_R;
  const labelX = priceX - 160;

  const priceLine = (label: string, amount: string, opts?: { bold?: boolean; color?: ReturnType<typeof rgb> }) => {
    const bold = opts?.bold ?? false;
    const color = opts?.color ?? darkGray;

    page.drawText(label, {
      x: labelX,
      y,
      size: 10,
      font: bold ? fontBold : fontRegular,
      color: bold ? color : medGray,
    });

    page.drawText(amount, {
      x: priceX - (bold ? fontBold : fontRegular).widthOfTextAtSize(amount, bold ? 12 : 10),
      y,
      size: bold ? 12 : 10,
      font: bold ? fontBold : fontRegular,
      color,
    });

    y -= 18;
  };

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
    thickness: 1.5,
    color: brandGreen,
  });

  y -= 6;
  priceLine("TOTAL", eur(data.totalAmount), { bold: true, color: brandGreen });

  if (data.customerNotes) {
    y -= 8;
    page.drawText("OBSERVACIONES", {
      x: MARGIN_L,
      y,
      size: 9,
      font: fontBold,
      color: medGray,
    });

    y -= 14;
    y = drawParagraph(page, data.customerNotes, MARGIN_L, y, CONTENT_W, fontRegular, 9, darkGray, 12);
  }

  y -= 22;
  page.drawRectangle({
    x: MARGIN_L,
    y: y - 18,
    width: CONTENT_W,
    height: 54,
    color: cream,
  });

  page.drawRectangle({
    x: MARGIN_L,
    y: y - 18,
    width: 6,
    height: 54,
    color: gold,
  });

  page.drawText("Tu reserva ya esta confirmada.", {
    x: MARGIN_L + 18,
    y: y + 12,
    size: 11,
    font: fontBold,
    color: brandGreen,
  });

  page.drawText("Adjuntamos este PDF como justificante y resumen del servicio contratado.", {
    x: MARGIN_L + 18,
    y: y - 2,
    size: 8.5,
    font: fontRegular,
    color: darkGray,
    maxWidth: CONTENT_W - 28,
  });

  page.drawText("Easy Brais - reservas.easybrais.es", {
    x: width / 2 - fontRegular.widthOfTextAtSize("Easy Brais - reservas.easybrais.es", 7) / 2,
    y: 30,
    size: 7,
    font: fontRegular,
    color: medGray,
  });

  page.drawText("Documento de reserva - No constituye factura fiscal", {
    x: width / 2 - fontRegular.widthOfTextAtSize("Documento de reserva - No constituye factura fiscal", 7) / 2,
    y: 20,
    size: 7,
    font: fontRegular,
    color: lightGray,
  });

  const instructionsPage = doc.addPage(PAGE_SIZE);
  const instructionsSize = instructionsPage.getSize();
  drawHeader(
    instructionsPage,
    fontRegular,
    fontBold,
    data.bookingCode,
    "Guia de recogida",
    "Instrucciones para preparar la mochila",
  );

  let pageY = instructionsSize.height - 164;
  instructionsPage.drawText("El procedimiento es muy sencillo.", {
    x: MARGIN_L,
    y: pageY,
    size: 14,
    font: fontBold,
    color: brandGreen,
  });

  pageY -= 30;
  for (const step of COLLECTION_STEPS) {
    pageY = drawParagraph(
      instructionsPage,
      step,
      MARGIN_L,
      pageY,
      CONTENT_W,
      fontRegular,
      10,
      darkGray,
      14,
    );
    pageY -= 10;
  }

  instructionsPage.drawRectangle({
    x: MARGIN_L,
    y: pageY - 50,
    width: CONTENT_W,
    height: 66,
    color: cream,
  });

  instructionsPage.drawText("Tarifas", {
    x: MARGIN_L + 16,
    y: pageY - 16,
    size: 11,
    font: fontBold,
    color: brandGreen,
  });

  instructionsPage.drawText("6 EUR / mochila y etapa", {
    x: MARGIN_L + 16,
    y: pageY - 32,
    size: 10,
    font: fontRegular,
    color: darkGray,
  });

  instructionsPage.drawText("11 EUR / mochila y etapa - mas de 20 kg", {
    x: MARGIN_L + 16,
    y: pageY - 46,
    size: 10,
    font: fontRegular,
    color: darkGray,
  });

  pageY -= 80;
  instructionsPage.drawText("Importante", {
    x: MARGIN_L,
    y: pageY,
    size: 11,
    font: fontBold,
    color: brandGreen,
  });

  pageY -= 18;
  drawParagraph(
    instructionsPage,
    COLLECTION_POSTSCRIPT,
    MARGIN_L,
    pageY,
    CONTENT_W,
    fontRegular,
    9,
    darkGray,
    13,
  );

  instructionsPage.drawText("Easy Brais - reservas.easybrais.es", {
    x: instructionsSize.width / 2 - fontRegular.widthOfTextAtSize("Easy Brais - reservas.easybrais.es", 7) / 2,
    y: 30,
    size: 7,
    font: fontRegular,
    color: medGray,
  });

  instructionsPage.drawText("Guia informativa de servicio", {
    x: instructionsSize.width / 2 - fontRegular.widthOfTextAtSize("Guia informativa de servicio", 7) / 2,
    y: 20,
    size: 7,
    font: fontRegular,
    color: lightGray,
  });

  return doc.save();
}
