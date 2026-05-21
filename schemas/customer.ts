import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter").max(120, "Nama pelanggan terlalu panjang"),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor HP minimal 8 digit")
    .max(24, "Nomor HP terlalu panjang")
    .regex(/^\d+$/, "Nomor HP hanya boleh angka"),
  licensePlate: z
    .string()
    .trim()
    .min(1, "Plat kendaraan wajib diisi")
    .max(20, "Plat kendaraan terlalu panjang")
    .transform((value) => value.toUpperCase()),
  vehicleType: z.enum(["mobil", "motor", "suv", "pickup", "van"]),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
