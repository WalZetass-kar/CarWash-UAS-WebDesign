import type { SessionUser } from "@/lib/auth/jwt";

export type Permission =
  | "customers:manage"
  | "packages:manage"
  | "queues:create"
  | "queues:update-status"
  | "payments:manage"
  | "transactions:delete"
  | "reports:read"
  | "reports:export"
  | "users:manage"
  | "settings:manage";

const permissions: Record<SessionUser["role"], Permission[]> = {
  admin: [
    "customers:manage",
    "packages:manage",
    "queues:create",
    "queues:update-status",
    "payments:manage",
    "transactions:delete",
    "reports:read",
    "reports:export",
    "users:manage",
    "settings:manage",
  ],
  kasir: ["payments:manage"],
  staff: ["queues:update-status"],
  petugas: ["customers:manage", "queues:create", "queues:update-status", "payments:manage"],
};

export function can(user: Pick<SessionUser, "role"> | null | undefined, permission: Permission) {
  if (!user) return false;
  return permissions[user.role]?.includes(permission) ?? false;
}

export function assertPermission(
  user: Pick<SessionUser, "role"> | null | undefined,
  permission: Permission,
) {
  if (!can(user, permission)) {
    throw new Error("Akses ditolak oleh RBAC.");
  }
}
