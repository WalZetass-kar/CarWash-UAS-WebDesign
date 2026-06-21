export const APP_NAME = "Kilap Kendaraan Car Wash";
export const APP_DESCRIPTION =
  "Aplikasi fullstack modern untuk booking, antrian, pembayaran, dan laporan operasional car wash.";
export const APP_TIME_ZONE = "Asia/Jakarta";

export const SESSION_COOKIE = "kilapkendaraan_session";
export const CSRF_COOKIE = "kilapkendaraan_csrf";
export const THEME_COOKIE = "kilapkendaraan_theme";

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
export const reviewSentiments = ["positif", "netral", "negatif"] as const;

export type Role = (typeof roles)[number];
export type PrimaryRole = (typeof primaryRoles)[number];
export type QueueStatus = (typeof queueStatuses)[number];
export type QueueWorkflowStatus = (typeof queueWorkflowStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type VehicleType = (typeof vehicleTypes)[number];
export type ReviewSentiment = (typeof reviewSentiments)[number];

export const roleLabels: Record<(typeof roles)[number], string> = {
  admin: "Admin",
  kasir: "Kasir",
  staff: "Staff",
  petugas: "Petugas",
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

export const reviewSentimentLabels: Record<ReviewSentiment, string> = {
  positif: "Positif",
  netral: "Netral",
  negatif: "Negatif",
};

export function normalizeQueueStatus(status: QueueStatus) {
  if (status === "diproses") return "sedang_dicuci" satisfies QueueWorkflowStatus;
  if (status === "dibatalkan") return "menunggu" satisfies QueueWorkflowStatus;
  return status;
}

export const protectedPrefixes = [
  "/dashboard",
  "/api/ai-reviews",
  "/api/customers",
  "/api/packages",
  "/api/queues",
  "/api/payments",
  "/api/settings",
  "/api/transactions",
  "/api/reports",
  "/api/search",
  "/api/users",
  "/api/uploads",
];

export const adminOnlyPrefixes = [
  "/dashboard/users",
  "/dashboard/settings",
  "/api/settings",
  "/api/users",
];

export const demoUsers = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Admin Kilap Kendaraan",
    email: "admin@kilapkendaraan.my.id",
    role: "admin" as const,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Kasir Kilap Kendaraan",
    email: "kasir@kilapkendaraan.my.id",
    role: "kasir" as const,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Staff Kilap Kendaraan",
    email: "staff@kilapkendaraan.my.id",
    role: "staff" as const,
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Petugas Kilap Kendaraan",
    email: "petugas@kilapkendaraan.my.id",
    role: "petugas" as const,
    isActive: true,
  },
];

export const demoUserPasswords: Record<string, string> = {
  "admin@kilapkendaraan.my.id": "admin123",
  "kasir@kilapkendaraan.my.id": "kasir123",
  "staff@kilapkendaraan.my.id": "staff123",
  "petugas@kilapkendaraan.my.id": "petugas123",
};

