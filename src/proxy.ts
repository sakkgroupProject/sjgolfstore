import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "sj_session";

/** Routes that require an authenticated session cookie. */
const PROTECTED = ["/account", "/admin"];
/** Routes that must be reachable while signed out. */
const PUBLIC_ACCOUNT = [
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
];

function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";

  // Content Security Policy. 'unsafe-inline' is required for Next.js hydration
  // and styled-jsx-free inline styles; everything else is locked down.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.pexels.com https://cdn.pixabay.com",
    "media-src 'self' blob:",
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // Defence-in-depth CSRF: reject cross-site state-changing navigations.
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        const requestHost = request.headers.get("host");
        if (requestHost && originHost !== requestHost) {
          return new NextResponse("Cross-site request blocked", { status: 403 });
        }
      } catch {
        return new NextResponse("Invalid origin", { status: 403 });
      }
    }
  }

  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (hasSession && PUBLIC_ACCOUNT.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return applySecurityHeaders(NextResponse.redirect(url), request);
  }

  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (needsAuth && !hasSession && !PUBLIC_ACCOUNT.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin") ? "/admin" : "/account/login";
    url.search = pathname.startsWith("/account") ? `?next=${encodeURIComponent(pathname + search)}` : "";
    return applySecurityHeaders(NextResponse.redirect(url), request);
  }

  return applySecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
