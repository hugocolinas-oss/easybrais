import { NextResponse } from "next/server";
import { getBrandLogoPngBytes } from "@easybrais/utils/pdf";

export const runtime = "nodejs";

export async function GET() {
  try {
    const file = await getBrandLogoPngBytes();

    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[brand/logo] failed to load asset:", message);
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }
}
