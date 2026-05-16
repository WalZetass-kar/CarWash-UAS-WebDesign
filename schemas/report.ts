import { z } from "zod";

export const reportFilterSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
});

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
