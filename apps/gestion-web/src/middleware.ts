import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@easybrais/utils/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  try {
    const { supabase } = createMiddlewareClient(request, response);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPublicPath = PUBLIC_PATHS.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    );

    if (!user && !isPublicPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }

    if (user && request.nextUrl.pathname === "/login") {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }

    return response;
  } catch (error) {
    console.error("Middleware auth check failed", error);
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
