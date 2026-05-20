"use client";

import { useMemo, useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const baseCartesianOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
        boxHeight: 8,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(148, 163, 184, 0.18)",
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

export function WeeklyBarChart({ data }: { data: Array<{ day: string; revenue: number; transactions: number }> }) {
  const [mode, setMode] = useState<"transactions" | "revenue">("transactions");
  const chartOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      ...baseCartesianOptions,
      plugins: {
        ...baseCartesianOptions.plugins,
        tooltip: {
          callbacks: {
            label(context: TooltipItem<"bar">) {
              const value = Number(context.raw ?? 0);
              return mode === "transactions"
                ? `${value} transaksi`
                : formatCurrency(value);
            },
          },
        },
      },
    }),
    [mode],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={mode === "transactions" ? "default" : "outline"} size="sm" onClick={() => setMode("transactions")}>
          Transaksi
        </Button>
        <Button variant={mode === "revenue" ? "default" : "outline"} size="sm" onClick={() => setMode("revenue")}>
          Pendapatan
        </Button>
      </div>
      <div className="h-72">
        <Bar
          options={chartOptions}
          data={{
            labels: data.map((item) => item.day),
            datasets: [
              {
                label: mode === "transactions" ? "Transaksi" : "Pendapatan",
                data: data.map((item) => (mode === "transactions" ? item.transactions : item.revenue)),
                backgroundColor: mode === "transactions" ? "rgba(8, 145, 178, 0.75)" : "rgba(16, 185, 129, 0.78)",
                borderRadius: 10,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}

export function MonthlyLineChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  return (
    <div className="h-72">
      <Line
        options={{
          ...baseCartesianOptions,
          plugins: {
            ...baseCartesianOptions.plugins,
            tooltip: {
              callbacks: {
                label(context: TooltipItem<"line">) {
                  return formatCurrency(Number(context.raw ?? 0));
                },
              },
            },
          },
        } satisfies ChartOptions<"line">}
        data={{
          labels: data.map((item) => item.month),
          datasets: [
            {
              label: "Pendapatan",
              data: data.map((item) => item.revenue),
              borderColor: "rgb(8, 145, 178)",
              backgroundColor: "rgba(8, 145, 178, 0.18)",
              pointBackgroundColor: "rgb(15, 76, 129)",
              fill: true,
              tension: 0.35,
            },
          ],
        }}
      />
    </div>
  );
}

export function PaymentPieChart({ paid, unpaid }: { paid: number; unpaid: number }) {
  return (
    <div className="h-72">
      <Doughnut
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: {
              position: "bottom" as const,
              labels: {
                usePointStyle: true,
                boxHeight: 8,
              },
            },
          },
        }}
        data={{
          labels: ["Lunas", "Belum Bayar"],
          datasets: [
            {
              data: [paid, unpaid],
              backgroundColor: ["rgba(16, 185, 129, 0.8)", "rgba(245, 158, 11, 0.8)"],
              borderWidth: 0,
              hoverOffset: 10,
            },
          ],
        }}
      />
    </div>
  );
}
