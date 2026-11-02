import { NextResponse, type NextRequest } from "next/server";

/** Deep-link return: unauthenticated requests are sent to the login page carrying the originally requested URL. */
const PUBLIC = [/^\/investor\/login/, /^\/investor\/forgot-password/, /^\/investor\/set-password/, /^\/operator/];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Bare domain: send each visitor straight to their destination in ONE hop.
  // (Previously "/" bounced to /investor/investments first, and anonymous visitors
  // were then bounced again to login — two full round trips before the page loaded.)
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = req.cookies.get("cc_portal_session") ? "/investor/investments" : "/investor/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (PUBLIC.some((r) => r.test(pathname))) return NextResponse.next();
  if (!req.cookies.get("cc_portal_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/investor/login";
    url.search = `?return=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/", "/investor/:path*", "/documents/:path*", "/opportunities/:path*"] };
