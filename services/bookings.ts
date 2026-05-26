import { createCustomer, deleteCustomer } from "@/services/customers";
import { listPackages } from "@/services/packages";
import { createQueue } from "@/services/queues";
import type { PublicBookingInput } from "@/schemas/public-booking";

export async function createPublicBooking(input: PublicBookingInput) {
  const availablePackages = await listPackages();
  const washPackage = availablePackages.find((item) => item.id === input.packageId && item.isActive);
  if (!washPackage) {
    throw new Error("Paket yang dipilih tidak tersedia.");
  }

  const customer = await createCustomer({
    name: input.name,
    phone: input.phone,
    licensePlate: input.licensePlate,
    vehicleType: input.vehicleType,
    notes: input.notes ?? null,
  });

  try {
    const queue = await createQueue({
      customerId: customer.id,
      packageId: washPackage.id,
      scheduledAt: input.scheduledAt,
      status: "menunggu",
      notes: input.notes ?? null,
    });

    return {
      customer,
      queue,
      packageName: washPackage.name,
      total: washPackage.price,
    };
  } catch (error) {
    try {
      await deleteCustomer(customer.id);
    } catch {
      // best-effort cleanup so the original booking error is preserved
    }
    throw error;
  }
}
