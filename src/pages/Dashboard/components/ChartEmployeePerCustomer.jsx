import { Icon } from "@iconify/react";
import "chart.js/auto";
import { Doughnut } from "react-chartjs-2";
import useLocalState from "../../../hooks/useLocalState";
import useSession, { inScope } from "../../../hooks/useSession";
import { useClients } from "../../MasterData/Client";

const distinctColors = (n) =>
  Array.from({ length: n }, (_, i) => `hsl(${(i * 360) / n}, 70%, 50%)`);

export default function ChartEmployeePerCustomer() {
  const [employees] = useLocalState("employees", []);
  const [session] = useSession();
  const clientOptions = useClients();
  const clientName = (id) =>
    clientOptions.find((c) => c.value === String(id))?.label ||
    "Tanpa Penempatan";

  const counts = {};
  employees
    .filter((e) => inScope(session, e))
    .forEach((e) => {
      const name = clientName(e.mem_customer_id);
      counts[name] = (counts[name] || 0) + 1;
    });

  const ASSIGNMENTS = Object.entries(counts).map(
    ([customerName, employeeCount]) => ({
      customerName,
      employeeCount,
    }),
  );
  const hasData = ASSIGNMENTS.length > 0;

  const labels = ASSIGNMENTS.map((i) => i.customerName.trim());
  const countsList = ASSIGNMENTS.map((i) => i.employeeCount);
  const colors = hasData ? distinctColors(labels.length) : ["#e2e8f0"];

  const data = {
    labels,
    datasets: [
      {
        data: hasData ? countsList : [1],
        backgroundColor: colors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // legend is now rendered manually below, so always turn off Chart.js's own legend
    plugins: {
      legend: { display: false },
      tooltip: hasData
        ? {
            callbacks: {
              label: (ctx) =>
                `${ctx.label}: ${countsList[ctx.dataIndex]} Karyawan`,
            },
          }
        : { enabled: false },
    },
    cutout: "65%",
    layout: { padding: 0 },
  };

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

      <div className="w-full px-6 py-2">
        <div className="w-full flex items-center justify-center gap-6 flex-wrap md:flex-nowrap">
          {/* Fixed-size chart box — same footprint whether or not there's data */}
          <div
            className="relative shrink-0"
            style={{ width: 220, height: 220 }}
          >
            <Doughnut data={data} options={options} />
            {!hasData && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Icon icon="heroicons-outline:users" className="h-8 w-8" />
                <p className="text-xs text-center px-4">
                  Belum ada data karyawan
                </p>
              </div>
            )}
          </div>

          {/* Manual legend, only when there's data */}
          {hasData && (
            <ul className="flex flex-col gap-1.5 text-sm text-slate-600 min-w-0">
              {labels.map((label, i) => (
                <li key={label} className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: colors[i] }}
                  />
                  <span className="truncate">{label}</span>
                  <span className="text-slate-400 shrink-0">
                    ({countsList[i]})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
