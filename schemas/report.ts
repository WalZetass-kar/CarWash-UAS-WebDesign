import { z } from "zod";

export const reportFilterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
});

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
