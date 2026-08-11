import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@easybrais/utils/supabase/middleware";

const GESTION_PUBLIC_PATHS = ["/gestion/login", "/gestion/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  if (!pathname.startsWith("/gestion")) {
    return response;
  }

  const isPublicPath = GESTION_PUBLIC_PATHS.includes(pathname);

  try {
    const { supabase } = createMiddlewareClient(request, response);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      if (isPublicPath) {
        return response;
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/gestion/login";
      loginUrl.searchParams.set("error", "session-expired");
      return NextResponse.redirect(loginUrl);
    }

    if (!user && !isPublicPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/gestion/login";
      return NextResponse.redirect(loginUrl);
    }

    if (user && pathname === "/gestion/login") {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/gestion";
      return NextResponse.redirect(homeUrl);
    }

    return response;
  } catch (error) {
    console.error("Middleware auth check failed", error);
    if (isPublicPath) return response;

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/gestion/login";
    loginUrl.search = "?error=auth-unavailable";
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/stripe/).*)",
  ],
};
