import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith("/admin/login");
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin/') || request.nextUrl.pathname.startsWith('/admin/insurances');
  const isAdmin =  token?.role === "ADMIN"
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    const authResponse = NextResponse.next();

    // restore cookies to the response
    request.cookies.getAll().forEach((c) => {
      response.cookies.set(c.name, c.value);
    });
    return authResponse;
  }

  if (!isAuth) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/admin/login?from=${encodeURIComponent(from)}`, request.url),
    );
  }
  if(isAdminRoute && !isAdmin){
    return NextResponse.redirect(new URL("/", request.url));
  }
  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self'`,
  );

  // restore cookies to the response
  request.cookies.getAll().forEach((c) => {
    response.cookies.set(c.name, c.value);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    // "/admin/:path((?!login).*)"
  ],
};
