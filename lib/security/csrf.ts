import { NextRequest } from "next/server";
import { CSRF_COOKIE } from "@/lib/constants";

export function createCsrfToken() {
  return crypto.randomUUID();
}

export function validateCsrf(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") return true;

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return false;
  }

  return true;
}
