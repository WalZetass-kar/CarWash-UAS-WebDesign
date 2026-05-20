import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid").max(180),
  password: z.string().min(6, "Password minimal 6 karakter").max(120),
  csrfToken: z.string().optional(),
});

export const userFormSchema = z.object({
  name: z.string().trim().min(2, "Nama user minimal 2 karakter").max(120, "Nama user terlalu panjang"),
  email: z.string().trim().email("Email tidak valid").max(180, "Email terlalu panjang"),
  password: z.string().min(6, "Password minimal 6 karakter").max(120).optional().or(z.literal("")),
  role: z.enum(["admin", "kasir", "staff", "petugas"]),
  isActive: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserFormInput = z.infer<typeof userFormSchema>;
