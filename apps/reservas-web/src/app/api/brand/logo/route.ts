import { NextResponse } from "next/server";

/** Legacy URL — logo oficial en `/public/logomochila.png`. */
export async function GET(request: Request) {
  const url = new URL("/logomochila.png", request.url);
  return NextResponse.redirect(url, 308);
}
