const DEVELOPMENT_JWT_SECRET = "kilapkendaraan-development-secret-change-in-production";
const MIN_JWT_SECRET_LENGTH = 32;
const JWT_SECRET_CANDIDATES = [
  "JWT_SECRET",
  "SUPABASE_JWT_SECRET",
  "yesssss_SUPABASE_JWT_SECRET",
] as const;

function getEnvValue(candidates: readonly string[]) {
  for (const envName of candidates) {
    const value = process.env[envName]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getJwtSecretValue() {
  const secret = getEnvValue(JWT_SECRET_CANDIDATES);

  if (secret && secret.length >= MIN_JWT_SECRET_LENGTH) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `JWT secret wajib diatur minimal 32 karakter untuk production. Isi salah satu env berikut: ${JWT_SECRET_CANDIDATES.join(", ")}.`,
    );
  }

  return DEVELOPMENT_JWT_SECRET;
}

export function getJwtSecret() {
  return new TextEncoder().encode(getJwtSecretValue());
}
