"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

const options = {
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
  return (
    <div className="h-72">
      <Bar
        options={options}
        data={{
          labels: data.map((item) => item.day),
          datasets: [
            {
              label: "Transaksi",
              data: data.map((item) => item.transactions),
              backgroundColor: "rgba(8, 145, 178, 0.75)",
              borderRadius: 6,
            },
          ],
        }}
      />
    </div>
  );
}

export function MonthlyLineChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  return (
    <div className="h-72">
      <Line
        options={options}
        data={{
          labels: data.map((item) => item.month),
          datasets: [
            {
              label: "Pendapatan",
              data: data.map((item) => item.revenue),
              borderColor: "rgb(8, 145, 178)",
              backgroundColor: "rgba(8, 145, 178, 0.18)",
              pointBackgroundColor: "rgb(15, 76, 129)",
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
      <Pie
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
