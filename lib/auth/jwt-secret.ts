const DEVELOPMENT_JWT_SECRET = "cleanride-development-secret-change-in-production";
const MIN_JWT_SECRET_LENGTH = 32;

export function getJwtSecretValue() {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret && secret.length >= MIN_JWT_SECRET_LENGTH) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET wajib diatur minimal 32 karakter untuk production.");
  }

  return DEVELOPMENT_JWT_SECRET;
}

export function getJwtSecret() {
  return new TextEncoder().encode(getJwtSecretValue());
}
