import { PDFDocument, type PDFImage } from "pdf-lib";
import { BRAND_LOGO_PNG_BASE64 } from "./logo-data";

let cachedLogoBytes: Uint8Array | null = null;

async function loadLogoBytes() {
  if (cachedLogoBytes) return cachedLogoBytes;

  cachedLogoBytes = Uint8Array.from(Buffer.from(BRAND_LOGO_PNG_BASE64, "base64"));
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

export async function getBrandLogoPngBytes(): Promise<Uint8Array> {
  return loadLogoBytes();
}
