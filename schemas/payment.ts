import { z } from "zod";

export const paymentSchema = z.object({
  transactionId: z.string().uuid("Transaksi wajib dipilih"),
  method: z.enum(["tunai", "transfer", "qris", "e-wallet"]),
  amount: z.coerce.number().int().min(0, "Harga tidak boleh minus"),
  status: z.enum(["belum_bayar", "lunas"]),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
