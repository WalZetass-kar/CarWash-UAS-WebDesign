import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(24),
  licensePlate: z.string().min(3).max(20),
  vehicleType: z.enum(["mobil", "motor", "suv", "pickup", "van"]),
  notes: z.string().max(500).optional().nullable(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
