import { Icon } from "@iconify/react";
import "chart.js/auto";
import { Bar } from "react-chartjs-2";

// ponytail: static — swap for a real dashboard API call when the backend is ready
const ATTENDANCE_WEEK = [
  { date: "Sen", attendanceCount: 24 },
  { date: "Sel", attendanceCount: 26 },
  { date: "Rab", attendanceCount: 22 },
  { date: "Kam", attendanceCount: 25 },
  { date: "Jum", attendanceCount: 20 },
  { date: "Sab", attendanceCount: 12 },
  { date: "Min", attendanceCount: 5 },
];

const data = {
  labels: ATTENDANCE_WEEK.map((i) => i.date),
  datasets: [
    {
      label: "Jumlah Kehadiran",
      data: ATTENDANCE_WEEK.map((i) => i.attendanceCount),
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top", labels: { color: "#333" } },
    tooltip: {
      callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} Kehadiran` },
    },
  },
  scales: {
    x: { ticks: { color: "#333" } },
    y: { beginAtZero: true, ticks: { color: "#333" } },
  },
};

export default function ChartAttendanceWeek() {
  return (
    <div className="w-full bg-white rounded-xl py-4 shadow-md flex flex-col gap-3 text-slate-900">
      <div className="flex items-center justify-between flex-wrap lg:flex-nowrap gap-3 border-b border-b-slate-300 pb-3 px-6">
        <div className="flex-1 flex gap-3 items-center">
          <div className="p-2 bg-purple-700 text-white rounded-full">
            <Icon icon="heroicons-outline:users" className="h-5 w-5" />
          </div>
          <h5 className="self-end text-xl font-semibold tracking-tight text-slate-900">
            Kehadiran Mingguan
          </h5>
        </div>
      </div>

      <div className="w-full px-4">
        <div className="w-full" style={{ position: "relative", height: "300px" }}>
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
