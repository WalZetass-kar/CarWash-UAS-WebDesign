import { NextRequest } from "next/server";
import { getQueueByPlate } from "@/services/queues";
import { jsonResponse, rejectUnavailableBackend } from "@/app/api/_utils";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ plate: string }> },
) {
  const backendResponse = rejectUnavailableBackend();
  if (backendResponse) return backendResponse;

  const { plate } = await params;
  if (!plate) return jsonResponse({ message: "Nomor plat wajib diisi" }, 400);

  let queue: Awaited<ReturnType<typeof getQueueByPlate>>;
  try {
    queue = await withDatabaseRetry(() => getQueueByPlate(plate), 3);
  } catch (error) {
    console.error("Tracking status lookup failed", error);
    return jsonResponse(
      { message: "Koneksi database status kendaraan sedang bermasalah. Coba lagi beberapa saat." },
      503,
    );
  }
  if (!queue) return jsonResponse({ message: "Antrian tidak ditemukan" }, 404);

  return jsonResponse(queue);
}
