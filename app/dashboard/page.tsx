import { Banknote, Car, PackageCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "@/services/dashboard";
import { formatCurrency } from "@/lib/utils";
import { MonthlyLineChart, PaymentPieChart, WeeklyBarChart } from "@/features/dashboard/charts";

export default async function DashboardPage() {
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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge>Realtime Analytics</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard Operasional</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Pantau pendapatan, antrian, pembayaran, dan performa paket pencucian.
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 px-4 py-3 text-sm text-cyan-800 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
          <div>Pendapatan hari ini: <span className="font-semibold">{formatCurrency(data.metrics.revenueToday)}</span></div>
          <div className="mt-1">Pendapatan bulan ini: <span className="font-semibold">{formatCurrency(data.metrics.revenueMonth)}</span></div>
          <div className="mt-1">Paket populer: <span className="font-semibold">{data.metrics.popularPackage}</span></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item, index) => (
          <Card key={item.title} className="animate-rise-in hover:-translate-y-0.5 hover:shadow-lg" style={{ animationDelay: `${index * 80}ms` }}>
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.title}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.note}</p>
              </div>
              <div className="grid size-11 place-items-center rounded-lg bg-slate-100 dark:bg-slate-900">
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
          </CardHeader>
          <CardContent>
            <WeeklyBarChart data={data.weeklyRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Pembayaran</CardTitle>
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
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={data.monthlyRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.activity.map((activity) => (
                <div key={activity} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                  {activity}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
