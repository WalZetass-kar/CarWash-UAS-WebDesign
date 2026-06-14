type RequestLike = {
  headers?: Headers;
  nextUrl?: URL;
};

export function isLocalHostname(hostname?: string | null) {
  if (!hostname) return false;

  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getConfiguredAppUrl() {
  return (
    parseAppUrl(process.env.NEXT_PUBLIC_APP_URL?.trim()) ??
    parseAppUrlFromVercelHost(process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) ??
    parseAppUrlFromVercelHost(process.env.VERCEL_URL?.trim())
  );
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

function parseAppUrl(rawUrl?: string) {
  if (!rawUrl) return null;

  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function parseAppUrlFromVercelHost(rawHost?: string) {
  if (!rawHost) return null;

  try {
    return new URL(rawHost.startsWith("http://") || rawHost.startsWith("https://") ? rawHost : `https://${rawHost}`);
  } catch {
    return null;
  }
}
