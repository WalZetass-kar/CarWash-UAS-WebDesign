import { z } from "zod";
import { customerSchema } from "@/schemas/customer";

export const publicBookingSchema = customerSchema.extend({
  packageId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
