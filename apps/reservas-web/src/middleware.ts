import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@easybrais/utils/supabase/middleware";

const GESTION_PUBLIC_PATHS = ["/gestion/login", "/gestion/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  if (!pathname.startsWith("/gestion")) {
    return response;
  }

  try {
    const { supabase } = createMiddlewareClient(request, response);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPublicPath = GESTION_PUBLIC_PATHS.some((p) =>
      pathname.startsWith(p)
    );

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
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/stripe/).*)",
  ],
};
