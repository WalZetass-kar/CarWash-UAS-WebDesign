import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  adminOnlyPrefixes,
  APP_TIME_ZONE,
  CSRF_COOKIE,
  protectedPrefixes,
  SESSION_COOKIE,
} from "@/lib/constants";
import { shouldUseSecureTransport } from "@/lib/runtime/app-origin";
import { getJwtSecret } from "@/lib/auth/jwt-secret";
import { securityHeaders } from "@/lib/security/headers";
import { getTodayKey } from "@/lib/utils";

async function readSession(token?: string) {
  if (!token) return null;

  const secret = getJwtSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    const user = payload.user as { role?: string } | undefined;
    if (!user?.role || payload.sessionDate !== getTodayKey(APP_TIME_ZONE)) return null;
    return { user };
  } catch {
    return null;
  }
}

function applyHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRequest = pathname === "/api" || pathname.startsWith("/api/");

  if (isApiRequest) {
    return applyHeaders(NextResponse.next());
  }

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isProtected = matches(pathname, protectedPrefixes);
  const isAdminOnly = matches(pathname, adminOnlyPrefixes);

  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete(SESSION_COOKIE);
    return applyHeaders(response);
  }

  if (pathname === "/login" && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return applyHeaders(NextResponse.redirect(url));
  }

  if (isAdminOnly && session?.user.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return applyHeaders(NextResponse.redirect(url));
  }

  const response = NextResponse.next();

  if (!request.cookies.get(CSRF_COOKIE)?.value) {
    response.cookies.set(CSRF_COOKIE, crypto.randomUUID(), {
      httpOnly: false,
      secure: shouldUseSecureTransport(request),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
  }

  return applyHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
