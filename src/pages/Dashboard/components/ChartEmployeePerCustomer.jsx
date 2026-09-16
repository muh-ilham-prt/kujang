import { Icon } from "@iconify/react";
import "chart.js/auto";
import { Doughnut } from "react-chartjs-2";

// ponytail: static — swap for a real dashboard API call when the backend is ready
const ASSIGNMENTS = [
  { customerName: "Penempatan A", employeeCount: 12 },
  { customerName: "Penempatan B", employeeCount: 8 },
  { customerName: "Penempatan C", employeeCount: 5 },
  { customerName: "Penempatan D", employeeCount: 3 },
];

const distinctColors = (n) =>
  Array.from({ length: n }, (_, i) => `hsl(${(i * 360) / n}, 70%, 50%)`);

const labels = ASSIGNMENTS.map((i) => i.customerName.trim());
const counts = ASSIGNMENTS.map((i) => i.employeeCount);

const data = {
  labels,
  datasets: [
    { data: counts, backgroundColor: distinctColors(labels.length), borderWidth: 1 },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      align: "start",
      labels: { color: "#444", padding: 2, font: { size: 12 }, usePointStyle: false },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.label}: ${counts[ctx.dataIndex]} Karyawan`,
      },
    },
  },
  layout: { padding: 0 },
};

export default function ChartEmployeePerCustomer() {
  return (
    <div className="w-full bg-white rounded-xl py-3 shadow-md flex flex-col gap-2 text-slate-900">
      <div className="flex items-center justify-between flex-wrap lg:flex-nowrap gap-3 border-b border-b-slate-300 pb-3 px-6">
        <div className="flex-1 flex gap-2 items-center">
          <div className="p-2 bg-purple-700 text-white rounded-full">
            <Icon icon="heroicons-outline:users" className="h-5 w-5" />
          </div>
          <h5 className="self-end text-xl font-semibold tracking-tight text-slate-900">
            Pembagian Karyawan Tiap Penempatan
          </h5>
        </div>
      </div>

      <div className="w-full pl-0 pr-2">
        <div className="w-full gap-0" style={{ position: "relative", height: "300px" }}>
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
