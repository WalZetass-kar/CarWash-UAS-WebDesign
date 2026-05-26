type RequestLike = {
  headers?: Headers;
  nextUrl?: URL;
};

export function isLocalHostname(hostname?: string | null) {
  if (!hostname) return false;

  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getConfiguredAppUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!rawUrl) return null;

  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

export function isLocalAppEnvironment() {
  const appUrl = getConfiguredAppUrl();
  return appUrl ? isLocalHostname(appUrl.hostname) : false;
}

export function shouldUseSecureTransport(request?: RequestLike) {
  const forwardedProto = request?.headers?.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request?.headers?.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHostname = forwardedHost ?? request?.nextUrl?.hostname;

  if (isLocalHostname(requestHostname)) return false;
  if (forwardedProto) return forwardedProto === "https";
  if (request?.nextUrl?.protocol) return request.nextUrl.protocol === "https:";

  const appUrl = getConfiguredAppUrl();
  if (appUrl) {
    if (isLocalHostname(appUrl.hostname)) return false;
    return appUrl.protocol === "https:";
  }

  return process.env.NODE_ENV === "production";
}
