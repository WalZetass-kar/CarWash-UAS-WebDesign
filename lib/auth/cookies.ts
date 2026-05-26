import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { CSRF_COOKIE, SESSION_COOKIE, THEME_COOKIE } from "@/lib/constants";
import { shouldUseSecureTransport } from "@/lib/runtime/app-origin";

export async function setSessionCookie(token: string, request?: NextRequest) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: shouldUseSecureTransport(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearSessionCookie(request?: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: shouldUseSecureTransport(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionCookie() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function getThemeCookie() {
  return (await cookies()).get(THEME_COOKIE)?.value;
}

export async function setCsrfCookie(token: string, request?: NextRequest) {
  (await cookies()).set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: shouldUseSecureTransport(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}
