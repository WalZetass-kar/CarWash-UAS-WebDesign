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
      title: "Pendapatan Hari Ini",
      value: formatCurrency(data.metrics.revenueToday),
      icon: Banknote,
      tone: "text-emerald-600",
    },
    {
      title: "Pendapatan Bulan Ini",
      value: formatCurrency(data.metrics.revenueMonth),
      icon: PackageCheck,
      tone: "text-cyan-600",
    },
    {
      title: "Total Pelanggan",
      value: data.metrics.totalCustomers.toLocaleString("id-ID"),
      icon: Users,
      tone: "text-indigo-600",
    },
    {
      title: "Kendaraan Dicuci",
      value: data.metrics.totalWashed.toLocaleString("id-ID"),
      icon: Car,
      tone: "text-amber-600",
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
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
          Paket populer: <span className="font-semibold">{data.metrics.popularPackage}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.title}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
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
