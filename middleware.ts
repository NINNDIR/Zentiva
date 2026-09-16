import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("zentiva_session");

  // Public paths exempt from authentication
  const isPublicPath =
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname === "/favicon.ico";

  const isAuthenticated = !!sessionCookie?.value;

  // 1. Unauthenticated user attempting to access protected route -> Redirect to /login
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user attempting to access /login -> Redirect to /dashboard
  if (isAuthenticated && pathname === "/login") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. Root path '/' redirect to dashboard if authenticated or login if not
  if (pathname === "/") {
    const targetUrl = isAuthenticated
      ? new URL("/dashboard", request.url)
      : new URL("/login", request.url);
    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - static files (images, css, js, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
