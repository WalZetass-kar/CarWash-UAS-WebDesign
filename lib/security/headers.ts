import { isLocalAppEnvironment } from "../runtime/app-origin";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isLocalPreview = isLocalAppEnvironment();
const shouldEnforceHttpsHeaders = isProduction && !isLocalPreview;

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${
    isDevelopment ? " ws: http://localhost:* http://127.0.0.1:*" : ""
  }`,
  "media-src 'self' blob: https://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(shouldEnforceHttpsHeaders ? ["upgrade-insecure-requests"] : []),
];

export const securityHeaders = {
  "Content-Security-Policy": cspDirectives.join("; "),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "X-XSS-Protection": "0",
  ...(shouldEnforceHttpsHeaders
    ? {
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      }
    : {}),
};
