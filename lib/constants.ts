export const APP_NAME = "CleanRide Car Wash";
export const APP_DESCRIPTION =
  "Aplikasi fullstack modern untuk booking, antrian, pembayaran, dan laporan operasional car wash.";

export const SESSION_COOKIE = "cleanride_session";
export const CSRF_COOKIE = "cleanride_csrf";
export const THEME_COOKIE = "cleanride_theme";

export const roles = ["admin", "petugas"] as const;
export const queueStatuses = ["menunggu", "diproses", "selesai", "dibatalkan"] as const;
export const paymentMethods = ["tunai", "transfer", "qris", "e-wallet"] as const;
export const paymentStatuses = ["belum_bayar", "lunas"] as const;
export const vehicleTypes = ["mobil", "motor", "suv", "pickup", "van"] as const;

export const roleLabels: Record<(typeof roles)[number], string> = {
  admin: "Admin",
  petugas: "Petugas/Kasir",
};

export const queueStatusLabels: Record<(typeof queueStatuses)[number], string> = {
  menunggu: "Menunggu",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
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

export const protectedPrefixes = ["/dashboard", "/api/customers", "/api/packages", "/api/queues", "/api/payments", "/api/reports", "/api/search", "/api/users"];

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
    id: "00000000-0000-4000-8000-000000000002",
    name: "Petugas CleanRide",
    email: "petugas@cleanride.my.id",
    role: "petugas" as const,
    isActive: true,
  },
];
