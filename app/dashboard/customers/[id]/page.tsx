import { notFound } from "next/navigation";
import { CustomerHistoryView } from "@/features/customers/customer-history";
import { requireRole } from "@/lib/auth/session";
import { getCustomerHistory } from "@/services/customer-history";

export const metadata = {
  title: "Riwayat Pelanggan",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "petugas"]);
  const { id } = await params;
  const data = await getCustomerHistory(id);

  if (!data) notFound();

  return <CustomerHistoryView data={JSON.parse(JSON.stringify(data))} />;
}
