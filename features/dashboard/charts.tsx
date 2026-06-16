"use client";

import { useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
  type ScriptableContext,
  type TooltipItem,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const axisLabelColor = "rgba(148, 163, 184, 0.95)";
const gridColor = "rgba(148, 163, 184, 0.14)";
const chartBorderColor = "rgba(15, 23, 42, 0.86)";

const baseCartesianOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 820,
    easing: "easeOutQuart" as const,
  },
  interaction: {
    intersect: false,
    mode: "index" as const,
  },
  plugins: {
    legend: {
      labels: {
        color: axisLabelColor,
        usePointStyle: true,
        boxHeight: 8,
        padding: 18,
      },
    },
    tooltip: {
      backgroundColor: "rgba(2, 6, 23, 0.94)",
      titleColor: "#ffffff",
      bodyColor: "rgba(226, 232, 240, 0.96)",
      borderColor: "rgba(34, 211, 238, 0.16)",
      borderWidth: 1,
      displayColors: true,
      padding: 12,
      cornerRadius: 14,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: axisLabelColor,
      },
      grid: {
        color: gridColor,
        drawBorder: false,
      },
      border: {
        display: false,
      },
    },
    x: {
      ticks: {
        color: axisLabelColor,
      },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
  },
};

function createVerticalGradient<TType extends "line" | "bar">(
  context: ScriptableContext<TType>,
  topColor: string,
  bottomColor: string,
) {
  const { chart } = context;
  const { ctx, chartArea } = chart;
  if (!chartArea) return topColor;

  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  return gradient;
}

export function WeeklyBarChart({ data }: { data: Array<{ day: string; revenue: number; transactions: number }> }) {
  const [mode, setMode] = useState<"transactions" | "revenue">("transactions");
  const chartOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      ...baseCartesianOptions,
      plugins: {
        ...baseCartesianOptions.plugins,
        tooltip: {
          ...baseCartesianOptions.plugins.tooltip,
          callbacks: {
            label(context: TooltipItem<"bar">) {
              const value = Number(context.raw ?? 0);
              return mode === "transactions" ? `${value} transaksi tercatat` : formatCurrency(value);
            },
            afterLabel(context: TooltipItem<"bar">) {
              const item = data[context.dataIndex];
              return mode === "transactions"
                ? `Pendapatan: ${formatCurrency(item?.revenue ?? 0)}`
                : `Transaksi: ${item?.transactions ?? 0}`;
            },
          },
        },
      },
    }),
    [data, mode],
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2 dark:border-slate-800/80 dark:bg-slate-900/70">
        <Button variant={mode === "transactions" ? "default" : "ghost"} size="sm" onClick={() => setMode("transactions")}>
          Transaksi
        </Button>
        <Button variant={mode === "revenue" ? "default" : "ghost"} size="sm" onClick={() => setMode("revenue")}>
          Pendapatan
        </Button>
      </div>
      <div className="h-80">
        <Bar
          options={chartOptions}
          data={{
            labels: data.map((item) => item.day),
            datasets: [
              {
                label: mode === "transactions" ? "Transaksi" : "Pendapatan",
                data: data.map((item) => (mode === "transactions" ? item.transactions : item.revenue)),
                backgroundColor: (context) =>
                  mode === "transactions"
                    ? createVerticalGradient(context, "rgba(14, 165, 233, 0.95)", "rgba(8, 145, 178, 0.45)")
                    : createVerticalGradient(context, "rgba(16, 185, 129, 0.95)", "rgba(8, 145, 178, 0.38)"),
                borderRadius: 14,
                borderSkipped: false,
                maxBarThickness: 40,
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
    <div className="h-80">
      <Line
        options={{
          ...baseCartesianOptions,
          plugins: {
            ...baseCartesianOptions.plugins,
            tooltip: {
              ...baseCartesianOptions.plugins.tooltip,
              callbacks: {
                label(context: TooltipItem<"line">) {
                  return `Pendapatan: ${formatCurrency(Number(context.raw ?? 0))}`;
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
              borderColor: "rgba(14, 165, 233, 0.92)",
              backgroundColor: (context) =>
                createVerticalGradient(context, "rgba(14, 165, 233, 0.28)", "rgba(14, 165, 233, 0.02)"),
              pointBackgroundColor: "rgba(255, 255, 255, 0.98)",
              pointBorderColor: "rgba(14, 165, 233, 0.92)",
              pointHoverBackgroundColor: "rgba(14, 165, 233, 1)",
              pointHoverBorderColor: "#ffffff",
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 3,
              fill: true,
              tension: 0.38,
            },
          ],
        }}
      />
    </div>
  );
}

export function PaymentPieChart({ paid, unpaid }: { paid: number; unpaid: number }) {
  const total = paid + unpaid;

  return (
    <div className="relative h-80">
      <Doughnut
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 820,
            easing: "easeOutQuart",
          },
          cutout: "72%",
          plugins: {
            tooltip: {
              backgroundColor: "rgba(2, 6, 23, 0.94)",
              titleColor: "#ffffff",
              bodyColor: "rgba(226, 232, 240, 0.96)",
              borderColor: "rgba(34, 211, 238, 0.16)",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 14,
              callbacks: {
                label(context: TooltipItem<"doughnut">) {
                  const value = Number(context.raw ?? 0);
                  const percentage = total ? Math.round((value / total) * 100) : 0;
                  return `${context.label}: ${value} invoice (${percentage}%)`;
                },
              },
            },
            legend: {
              position: "bottom" as const,
              labels: {
                color: axisLabelColor,
                usePointStyle: true,
                boxHeight: 8,
                padding: 18,
              },
            },
          },
        }}
        data={{
          labels: ["Lunas", "Belum Bayar"],
          datasets: [
            {
              data: [paid, unpaid],
              backgroundColor: ["rgba(16, 185, 129, 0.88)", "rgba(245, 158, 11, 0.84)"],
              borderColor: chartBorderColor,
              borderWidth: 4,
              hoverOffset: 10,
            },
          ],
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Collection</div>
        <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{total}</div>
        <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">invoice dipantau</div>
      </div>
    </div>
  );
}
