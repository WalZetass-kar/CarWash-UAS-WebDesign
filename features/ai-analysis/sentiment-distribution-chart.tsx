"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip, type ChartOptions, type TooltipItem } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function SentimentDistributionChart({
  positive,
  neutral,
  negative,
  satisfactionRate,
}: {
  positive: number;
  neutral: number;
  negative: number;
  satisfactionRate: number;
}) {
  const total = positive + neutral + negative;

  if (!total) {
    return (
      <div className="grid h-80 place-items-center rounded-3xl border border-white/10 bg-white/5 px-6 text-center">
        <div>
          <div className="text-sm font-semibold text-white">Belum ada distribusi sentimen</div>
          <p className="mt-2 text-sm text-slate-400">
            Review yang baru dianalisis akan langsung muncul di chart ini tanpa mengganggu modul dashboard lain.
          </p>
        </div>
      </div>
    );
  }

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "rgba(226, 232, 240, 0.88)",
          usePointStyle: true,
          boxHeight: 9,
          padding: 18,
        },
      },
      tooltip: {
        callbacks: {
          label(context: TooltipItem<"doughnut">) {
            const value = Number(context.raw ?? 0);
            const percentage = total ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} review (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="relative h-80">
      <Doughnut
        options={options}
        data={{
          labels: ["Positif", "Netral", "Negatif"],
          datasets: [
            {
              data: [positive, neutral, negative],
              backgroundColor: [
                "rgba(16, 185, 129, 0.88)",
                "rgba(245, 158, 11, 0.84)",
                "rgba(244, 63, 94, 0.86)",
              ],
              borderColor: "rgba(15, 23, 42, 0.8)",
              borderWidth: 4,
              hoverOffset: 10,
            },
          ],
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Kepuasan</div>
        <div className="mt-2 text-4xl font-semibold text-white">{satisfactionRate}%</div>
        <div className="mt-2 text-sm text-slate-400">{total} review tersimpan</div>
      </div>
    </div>
  );
}
