import { z } from "zod";

export const paymentSchema = z.object({
  transactionId: z.string().uuid(),
  method: z.enum(["tunai", "transfer", "qris", "e-wallet"]),
  amount: z.coerce.number().int().min(1000),
  status: z.literal("lunas"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
