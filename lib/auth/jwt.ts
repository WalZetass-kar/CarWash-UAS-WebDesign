import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { getJwtSecret } from "@/lib/auth/jwt-secret";
import { APP_TIME_ZONE } from "@/lib/constants";
import { getTodayKey } from "@/lib/utils";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "petugas";
};

export type SessionPayload = JWTPayload & {
  user: SessionUser;
  sessionDate: string;
};

export async function signSession(user: SessionUser) {
  return new SignJWT({
    user,
    sessionDate: getTodayKey(APP_TIME_ZONE),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .setSubject(user.id)
    .sign(getJwtSecret());
}

export async function verifySession(token?: string | null) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const session = payload as SessionPayload;
    if (!session.user || session.sessionDate !== getTodayKey(APP_TIME_ZONE)) return null;
    return session;
  } catch {
    return null;
  }
}
