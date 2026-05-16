import DOMPurify from "isomorphic-dompurify";

export function sanitizeString(value: string) {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitizeString(value) : value,
    ]),
  ) as T;
}
