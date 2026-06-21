import { z } from "zod";

export const aiReviewSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Nama pelanggan minimal 2 karakter")
    .max(120, "Nama pelanggan terlalu panjang"),
  review: z
    .string()
    .trim()
    .min(5, "Review minimal 5 karakter")
    .max(1000, "Review maksimal 1000 karakter"),
});

export type AiReviewInput = z.infer<typeof aiReviewSchema>;
