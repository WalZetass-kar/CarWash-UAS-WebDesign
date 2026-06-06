import { z } from "zod";

export const reportFilterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  method: z.enum(["tunai", "transfer", "qris", "e-wallet"]).optional(),
  status: z.enum(["belum_bayar", "lunas"]).optional(),
  packageName: z.string().trim().max(120).optional(),
  format: z.enum(["json", "csv", "pdf", "xlsx"]).default("json"),
});

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
