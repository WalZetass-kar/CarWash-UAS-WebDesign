import { z } from "zod";

export const packageSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(8).max(600),
  price: z.coerce.number().int().min(1000),
  estimatedMinutes: z.coerce.number().int().min(5).max(480),
  isActive: z.boolean().default(true),
});

export type PackageInput = z.infer<typeof packageSchema>;
