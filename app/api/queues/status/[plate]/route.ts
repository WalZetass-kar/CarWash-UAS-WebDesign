import { NextRequest } from "next/server";
import { getQueueByPlate } from "@/services/queues";
import { jsonResponse } from "@/app/api/_utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ plate: string }> },
) {
  const { plate } = await params;
  if (!plate) return jsonResponse({ message: "Nomor plat wajib diisi" }, 400);

  const queue = await getQueueByPlate(plate);
  if (!queue) return jsonResponse({ message: "Antrian tidak ditemukan" }, 404);

  return jsonResponse(queue);
}
