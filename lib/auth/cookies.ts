import { cookies } from "next/headers";
import { CSRF_COOKIE, SESSION_COOKIE, THEME_COOKIE } from "@/lib/constants";

const isProduction = process.env.NODE_ENV === "production";

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProduction,
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

export async function setCsrfCookie(token: string) {
  (await cookies()).set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}
