export const APP_NAME = "CleanRide Car Wash";
export const APP_DESCRIPTION =
  "Aplikasi fullstack modern untuk booking, antrian, pembayaran, dan laporan operasional car wash.";

export const SESSION_COOKIE = "cleanride_session";
export const CSRF_COOKIE = "cleanride_csrf";
export const THEME_COOKIE = "cleanride_theme";

export const roles = ["admin", "kasir", "staff", "petugas"] as const;
export const primaryRoles = ["admin", "kasir", "staff"] as const;
export const queueWorkflowStatuses = [
  "menunggu",
  "antrian",
  "sedang_dicuci",
  "interior_cleaning",
  "finishing",
  "selesai",
] as const;
export const queueStatuses = [...queueWorkflowStatuses, "dibatalkan", "diproses"] as const;
export const paymentMethods = ["tunai", "transfer", "qris", "e-wallet"] as const;
export const paymentStatuses = ["belum_bayar", "lunas"] as const;
export const vehicleTypes = ["mobil", "motor", "suv", "pickup", "van"] as const;

export type Role = (typeof roles)[number];
export type PrimaryRole = (typeof primaryRoles)[number];
export type QueueStatus = (typeof queueStatuses)[number];
export type QueueWorkflowStatus = (typeof queueWorkflowStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type VehicleType = (typeof vehicleTypes)[number];

export const roleLabels: Record<(typeof roles)[number], string> = {
  admin: "Admin",
  kasir: "Kasir",
  staff: "Staff",
  petugas: "Petugas (Legacy)",
};

export const queueStatusLabels: Record<(typeof queueStatuses)[number], string> = {
  menunggu: "Menunggu",
  antrian: "Antrian",
  sedang_dicuci: "Sedang Dicuci",
  interior_cleaning: "Interior Cleaning",
  finishing: "Finishing",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  diproses: "Sedang Dicuci",
};

export const paymentMethodLabels: Record<(typeof paymentMethods)[number], string> = {
  tunai: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
  "e-wallet": "E-Wallet",
};

export const paymentStatusLabels: Record<(typeof paymentStatuses)[number], string> = {
  belum_bayar: "Belum Bayar",
  lunas: "Lunas",
};

export function normalizeQueueStatus(status: QueueStatus) {
  if (status === "diproses") return "sedang_dicuci" satisfies QueueWorkflowStatus;
  if (status === "dibatalkan") return "menunggu" satisfies QueueWorkflowStatus;
  return status;
}

export const protectedPrefixes = [
  "/dashboard",
  "/api/customers",
  "/api/packages",
  "/api/queues",
  "/api/payments",
  "/api/transactions",
  "/api/reports",
  "/api/search",
  "/api/users",
  "/api/uploads",
];

export const adminOnlyPrefixes = ["/dashboard/users", "/dashboard/settings", "/api/users"];

export const demoUsers = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Admin CleanRide",
    email: "admin@cleanride.my.id",
    role: "admin" as const,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Kasir CleanRide",
    email: "kasir@cleanride.my.id",
    role: "kasir" as const,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Staff CleanRide",
    email: "staff@cleanride.my.id",
    role: "staff" as const,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Petugas CleanRide",
    email: "petugas@cleanride.my.id",
    role: "petugas" as const,
    isActive: true,
  },
];

export const demoUserPasswords: Record<string, string> = {
  "admin@cleanride.my.id": "admin123",
  "kasir@cleanride.my.id": "kasir123",
  "staff@cleanride.my.id": "staff123",
  "petugas@cleanride.my.id": "petugas123",
};
