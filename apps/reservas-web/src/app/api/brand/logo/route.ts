import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const logoPath = path.join(process.cwd(), "assets", "LOGOMOCHILA 2.png");
    const file = await fs.readFile(logoPath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[brand/logo] failed to read asset:", message);
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }
}
