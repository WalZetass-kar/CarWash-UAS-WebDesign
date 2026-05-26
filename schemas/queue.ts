import { z } from "zod";

export const queueSchema = z.object({
  customerId: z.string().uuid("Pelanggan wajib dipilih"),
  packageId: z.string().uuid("Paket wajib dipilih"),
  scheduledAt: z.coerce.date(),
  status: z
    .enum(["menunggu", "antrian", "sedang_dicuci", "interior_cleaning", "finishing", "selesai", "dibatalkan", "diproses"])
    .default("menunggu"),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
});

export const queueStatusSchema = z.object({
  status: z.enum(["menunggu", "antrian", "sedang_dicuci", "interior_cleaning", "finishing", "selesai", "dibatalkan", "diproses"]),
});

export type QueueInput = z.infer<typeof queueSchema>;
export type QueueStatusInput = z.infer<typeof queueStatusSchema>;
