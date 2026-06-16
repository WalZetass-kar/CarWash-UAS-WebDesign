import { ArrowUpRight, Banknote, Car, PackageCheck, Sparkles, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/services/dashboard";
import { formatCurrency } from "@/lib/utils";
import { MonthlyLineChart, PaymentPieChart, WeeklyBarChart } from "@/features/dashboard/charts";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData();
  const paid = data.payments.filter((payment) => payment.status === "lunas").length;
  const unpaid = data.payments.filter((payment) => payment.status === "belum_bayar").length;

  const cards = [
    {
      title: "Total Transaksi Hari Ini",
      value: data.metrics.totalTransactionsToday.toLocaleString("id-ID"),
      icon: Banknote,
      tone: "text-cyan-600",
      note: "Semua transaksi yang tercatat hari ini",
    },
    {
      title: "Total Kendaraan Hari Ini",
      value: data.metrics.totalVehiclesToday.toLocaleString("id-ID"),
      icon: PackageCheck,
      tone: "text-amber-600",
      note: "Antrian kendaraan aktif dan terjadwal",
    },
    {
      title: "Kendaraan Selesai",
      value: data.metrics.completedToday.toLocaleString("id-ID"),
      icon: Users,
      tone: "text-emerald-600",
      note: "Unit yang selesai dikerjakan hari ini",
    },
    {
      title: "Kendaraan Dalam Proses",
      value: data.metrics.inProgressToday.toLocaleString("id-ID"),
      icon: Car,
      tone: "text-sky-600",
      note: "Status antrian yang sedang berjalan",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.28fr_0.72fr]">
        <Card className="overflow-hidden border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,1))] text-white">
          <CardContent className="relative flex h-full flex-col justify-between gap-8 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <Badge className="bg-white/10 text-cyan-100 ring-white/10">
                  <Sparkles className="mr-1 size-3" />
                  Realtime Analytics
                </Badge>
                <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {getGreeting()}, {session.user.name.split(" ")[0]}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Dashboard operasional CleanRide dirancang untuk memantau pendapatan, antrian, pembayaran, dan performa layanan dengan tampilan yang lebih fokus dan profesional.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Status Hari Ini</div>
                <div className="mt-2 flex items-center gap-2 font-semibold text-white">
                  <span className="inline-flex size-2 rounded-full bg-emerald-400" />
                  Operasional Aktif
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Pendapatan Hari Ini" value={formatCurrency(data.metrics.revenueToday)} />
              <HeroMetric label="Pendapatan Bulan Ini" value={formatCurrency(data.metrics.revenueMonth)} />
              <HeroMetric label="Paket Paling Populer" value={data.metrics.popularPackage} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <QuickPanel
            label="Antrian Aktif"
            value={data.metrics.queueActive.toLocaleString("id-ID")}
            description="Kendaraan yang sedang bergerak di workflow operasional."
          />
          <QuickPanel
            label="Total Pelanggan"
            value={data.metrics.totalCustomers.toLocaleString("id-ID")}
            description="Database pelanggan yang sudah tercatat dan siap diproses."
          />
          <QuickPanel
            label="Total Cuci Selesai"
            value={data.metrics.totalWashed.toLocaleString("id-ID")}
            description="Akumulasi unit yang berhasil dituntaskan oleh tim CleanRide."
          />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item, index) => (
          <Card
            key={item.title}
            className="animate-rise-in h-full overflow-hidden"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <CardContent className="flex h-full items-start justify-between gap-4 pt-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.title}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{item.value}</p>
                <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">{item.note}</p>
              </div>
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                <item.icon className={`size-5 ${item.tone}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Statistik Transaksi Mingguan</CardTitle>
            <CardDescription>
              Pantau pergerakan volume transaksi dan revenue mingguan dalam satu grafik yang lebih mudah dibaca.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyBarChart data={data.weeklyRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Pembayaran</CardTitle>
            <CardDescription>
              Komposisi invoice lunas dan belum bayar untuk pengambilan keputusan kasir yang lebih cepat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentPieChart paid={paid} unpaid={unpaid} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan Bulanan</CardTitle>
            <CardDescription>
              Tren revenue enam bulan terakhir dengan tampilan yang lebih bersih dan fokus ke pola kenaikan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={data.monthlyRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>
              Ringkasan aktivitas penting dashboard agar tim tetap cepat membaca kondisi operasional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.activity.map((activity, index) => (
                <div
                  key={activity}
                  className="flex items-start gap-3 rounded-[1.3rem] border border-slate-200/80 bg-slate-50/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/72"
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200">
                    <ArrowUpRight className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Aktivitas {index + 1}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{activity}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function QuickPanel({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between pt-6">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
        <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</div>
        <div className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">{description}</div>
      </CardContent>
    </Card>
  );
}
