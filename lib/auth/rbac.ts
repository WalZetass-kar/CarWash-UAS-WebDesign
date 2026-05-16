import type { SessionUser } from "@/lib/auth/jwt";

export type Permission =
  | "customers:manage"
  | "packages:manage"
  | "queues:manage"
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
    "queues:manage",
    "payments:manage",
    "transactions:delete",
    "reports:read",
    "reports:export",
    "users:manage",
    "settings:manage",
  ],
  petugas: ["customers:manage", "queues:manage", "payments:manage"],
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
