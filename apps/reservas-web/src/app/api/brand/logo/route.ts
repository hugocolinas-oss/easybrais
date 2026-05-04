import { NextResponse } from "next/server";

/** Legacy URL — logo is served from `/public/brand-logo.png`. */
export async function GET(request: Request) {
  const url = new URL("/brand-logo.png", request.url);
  return NextResponse.redirect(url, 308);
}
