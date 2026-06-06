"use client";

import { useState } from "react";
import { Search, Car, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queueStatusLabels, type QueueStatus } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

const statusVariant: Record<QueueStatus, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  menunggu: "warning",
  antrian: "warning",
  sedang_dicuci: "default",
  interior_cleaning: "default",
  finishing: "default",
  diproses: "default",
  selesai: "success",
  dibatalkan: "destructive",
};

export default function TrackingPage() {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!plate) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/queues/status/${encodeURIComponent(plate)}`);
      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.message || "Gagal mencari status kendaraan");
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="relative size-8 overflow-hidden rounded-lg">
               <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-slate-900 dark:text-white">Kilap Kendaraan</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Lacak Status Kendaraan
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Masukkan nomor plat kendaraan Anda untuk melihat progres pencucian secara realtime.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-8 flex gap-2">
          <Input
            placeholder="Contoh: B 1234 ABC"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            className="text-lg font-semibold tracking-wider"
          />
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Mencari..." : <Search className="size-5" />}
          </Button>
        </form>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="size-5" />
            <p>{error}</p>
          </div>
        )}

        {result && (
          <Card className="mt-8 overflow-hidden border-cyan-100 shadow-xl dark:border-cyan-900/20">
            <CardHeader className="bg-cyan-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider opacity-80">No. Antrian</p>
                  <CardTitle className="text-2xl">{result.queueNumber}</CardTitle>
                </div>
                <Badge variant="secondary" className="border-white/40 text-white">
                   {result.packageName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pelanggan</p>
                  <p className="font-semibold">{result.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Nomor Plat</p>
                  <p className="font-semibold">{result.licensePlate}</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-100 p-6 text-center dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Status Saat Ini</p>
                <Badge variant={statusVariant[result.status as QueueStatus]} className="px-4 py-1 text-base">
                  {queueStatusLabels[result.status as QueueStatus]}
                </Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <Clock className="size-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Jadwal Kedatangan</p>
                  <p className="text-sm font-medium">{formatDate(result.scheduledAt)}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Progres</p>
                <div className="relative flex justify-between">
                  <div className="absolute top-2.5 left-0 h-0.5 w-full bg-slate-200 dark:bg-slate-800" />
                  {["menunggu", "sedang_dicuci", "selesai"].map((s, idx) => {
                    const isDone = ["selesai"].includes(result.status) || (result.status === "sedang_dicuci" && s === "menunggu") || s === result.status;
                    const isActive = s === result.status || (result.status === "sedang_dicuci" && s === "sedang_dicuci") || (result.status === "selesai");
                    
                    return (
                      <div key={s} className="relative z-10 flex flex-col items-center">
                        <div className={`grid size-6 place-items-center rounded-full border-2 transition-colors ${
                          isActive || isDone ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-slate-300 text-slate-300 dark:bg-slate-950 dark:border-slate-700"
                        }`}>
                          <CheckCircle2 className="size-3.5" />
                        </div>
                        <span className="mt-2 text-[10px] font-medium uppercase text-slate-500">{s.replace("_", " ")}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
