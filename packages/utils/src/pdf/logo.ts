import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument, type PDFImage } from "pdf-lib";

let cachedLogoBytes: Uint8Array | null = null;

async function loadLogoBytes() {
  if (cachedLogoBytes) return cachedLogoBytes;

  const logoPath = path.join(process.cwd(), "assets", "LOGOMOCHILA 2.png");
  const file = await fs.readFile(logoPath);
  cachedLogoBytes = new Uint8Array(file);
  return cachedLogoBytes;
}

export async function embedBrandLogo(doc: PDFDocument): Promise<PDFImage | null> {
  try {
    const bytes = await loadLogoBytes();
    return await doc.embedPng(bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[pdf] brand logo load failed:", message);
    return null;
  }
}
