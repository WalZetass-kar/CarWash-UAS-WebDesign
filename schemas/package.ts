import { z } from "zod";

export const packageSchema = z.object({
  name: z.string().trim().min(2, "Nama paket minimal 2 karakter").max(120, "Nama paket terlalu panjang"),
  description: z
    .string()
    .trim()
    .min(8, "Deskripsi paket minimal 8 karakter")
    .max(600, "Deskripsi paket terlalu panjang"),
  price: z.coerce.number().int().min(0, "Harga tidak boleh minus"),
  estimatedMinutes: z.coerce.number().int().min(5, "Durasi minimal 5 menit").max(480, "Durasi maksimal 480 menit"),
  imageUrl: z
    .union([z.string().trim().url("URL gambar tidak valid"), z.literal(""), z.null()])
    .optional()
    .transform((value) => (typeof value === "string" && value.length > 0 ? value : null)),
  isActive: z.boolean().default(true),
});

export type PackageInput = z.infer<typeof packageSchema>;
