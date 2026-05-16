import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid").max(180),
  password: z.string().min(6, "Password minimal 6 karakter").max(120),
  csrfToken: z.string().optional(),
});

export const userFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  password: z.string().min(6).max(120).optional().or(z.literal("")),
  role: z.enum(["admin", "petugas"]),
  isActive: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserFormInput = z.infer<typeof userFormSchema>;
