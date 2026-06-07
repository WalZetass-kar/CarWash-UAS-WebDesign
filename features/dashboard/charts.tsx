"use client";

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
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, Tooltip, Legend);

const sharedCartesianOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      displayColors: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(148, 163, 184, 0.18)",
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        autoSkipPadding: 12,
        maxRotation: 0,
        minRotation: 0,
        font: {
          size: 11,
        },
      },
    },
  },
};

const barOptions: ChartOptions<"bar"> = sharedCartesianOptions;
const lineOptions: ChartOptions<"line"> = sharedCartesianOptions;

const pieOptions: ChartOptions<"pie"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        boxHeight: 8,
        padding: 16,
        font: {
          size: 11,
        },
      },
    },
  },
};

export function WeeklyBarChart({ data }: { data: Array<{ day: string; revenue: number; transactions: number }> }) {
  return (
    <div className="h-60 sm:h-72">
      <Bar
        options={barOptions}
        data={{
          labels: data.map((item) => item.day),
          datasets: [
            {
              label: "Transaksi",
              data: data.map((item) => item.transactions),
              backgroundColor: "rgba(8, 145, 178, 0.75)",
              borderRadius: 6,
              maxBarThickness: 36,
            },
          ],
        }}
      />
    </div>
  );
}

export function MonthlyLineChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  return (
    <div className="h-60 sm:h-72">
      <Line
        options={lineOptions}
        data={{
          labels: data.map((item) => item.month),
          datasets: [
            {
              label: "Pendapatan",
              data: data.map((item) => item.revenue),
              borderColor: "rgb(8, 145, 178)",
              backgroundColor: "rgba(8, 145, 178, 0.18)",
              pointBackgroundColor: "rgb(15, 76, 129)",
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.35,
              fill: true,
            },
          ],
        }}
      />
    </div>
  );
}

export function PaymentPieChart({ paid, unpaid }: { paid: number; unpaid: number }) {
  return (
    <div className="h-60 sm:h-72">
      <Pie
        options={pieOptions}
        data={{
          labels: ["Lunas", "Belum Bayar"],
          datasets: [
            {
              data: [paid, unpaid],
              backgroundColor: ["rgba(16, 185, 129, 0.8)", "rgba(245, 158, 11, 0.8)"],
              borderWidth: 0,
            },
          ],
        }}
      />
    </div>
  );
}
