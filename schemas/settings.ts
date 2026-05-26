import { z } from "zod";

export const appSettingsSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  businessPhone: z.string().trim().max(40),
  businessAddress: z.string().trim().max(500),
  queueSlotCapacity: z.coerce.number().int().min(1).max(24),
  reportDefaultRangeDays: z.coerce.number().int().min(1).max(90),
  autoPrintInvoice: z.boolean(),
  invoiceFooter: z.string().trim().max(300),
});

export type AppSettingsInput = z.infer<typeof appSettingsSchema>;
