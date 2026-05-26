import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getTodayKey(timeZone = "Asia/Jakarta") {
  return getDateKey(new Date(), timeZone);
}

export function getDateKey(value: Date | string | number | null | undefined, timeZone = "Asia/Jakarta") {
  if (value === null || value === undefined) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return getDateParts(date, timeZone).dateKey;
}

export function getMonthKey(value: Date | string | null | undefined, timeZone = "Asia/Jakarta") {
  if (!value) return null;

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  const parts = getDateParts(date, timeZone);
  return `${parts.year}-${parts.month}`;
}

export function getHourKey(value: Date | string | null | undefined, timeZone = "Asia/Jakarta") {
  if (!value) return null;

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  const parts = getDateParts(date, timeZone);
  return `${parts.dateKey} ${parts.hour}`;
}

export function formatDateInput(value: Date | string, timeZone = "Asia/Jakarta") {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  return getDateParts(date, timeZone).dateKey;
}

export function getLastDays(count: number, timeZone = "Asia/Jakarta") {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));

    return {
      date,
      key: getTodayKeyForDate(date, timeZone),
      label: new Intl.DateTimeFormat("id-ID", {
        weekday: "short",
        timeZone,
      }).format(date),
    };
  });
}

export function getLastMonths(count: number, timeZone = "Asia/Jakarta") {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - index - 1));

    return {
      date,
      key: getMonthKey(date, timeZone) ?? "",
      label: new Intl.DateTimeFormat("id-ID", {
        month: "short",
        timeZone,
      }).format(date),
    };
  });
}

function getTodayKeyForDate(date: Date, timeZone: string) {
  return getDateParts(date, timeZone).dateKey;
}

function getDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";

  return {
    year,
    month,
    day,
    hour,
    dateKey: `${year}-${month}-${day}`,
  };
}

export function getClientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
