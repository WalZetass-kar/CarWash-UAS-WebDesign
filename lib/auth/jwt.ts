import { jwtVerify, SignJWT, type JWTPayload } from "jose";
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

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || "cleanride-development-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({
    user,
    sessionDate: getTodayKey(),
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
    if (!session.user || session.sessionDate !== getTodayKey()) return null;
    return session;
  } catch {
    return null;
  }
}
