import { z } from "zod";

export const queueSchema = z.object({
  customerId: z.string().uuid(),
  packageId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  status: z.enum(["menunggu", "diproses", "selesai", "dibatalkan"]).default("menunggu"),
  notes: z.string().max(500).optional().nullable(),
});

export const queueStatusSchema = z.object({
  status: z.enum(["menunggu", "diproses", "selesai", "dibatalkan"]),
});

export type QueueInput = z.infer<typeof queueSchema>;
export type QueueStatusInput = z.infer<typeof queueStatusSchema>;
