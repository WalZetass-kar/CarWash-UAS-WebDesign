import type { ZodError } from "zod";

export type FormErrors = Record<string, string>;

export function getFormErrors(error: ZodError): FormErrors {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

export async function getResponseMessage(response: Response, fallback: string) {
  try {
    const payload = await response.clone().json();
    return typeof payload?.message === "string" ? payload.message : fallback;
  } catch {
    return fallback;
  }
}
