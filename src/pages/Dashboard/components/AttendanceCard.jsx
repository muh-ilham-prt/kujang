import { Icon } from "@iconify/react";

const STATUS = {
  present: {
    icon: "fa6-solid:user-check",
    gradient:
      "from-green-600 to-emerald-500 hover:from-emerald-500 hover:to-green-600",
  },
  leave: {
    icon: "fa6-solid:user-clock",
    gradient:
      "from-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-500",
  },
  absent: {
    icon: "fa6-solid:user-xmark",
    gradient: "from-red-600 to-rose-500 hover:from-rose-500 hover:to-red-600",
  },
};

export default function AttendanceCard({ title, count, percentage, status }) {
  const { icon, gradient } = STATUS[status];

  return (
    <div
      className={`w-full bg-linear-to-br border-none ${gradient} rounded-[20px] overflow-hidden shadow-lg transition-all duration-300 transform hover:scale-[1.02] p-6`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-full">
            <Icon icon={icon} className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="px-4 py-2 text-sm font-bold bg-white/20 backdrop-blur-md text-white rounded-lg">
          {percentage}%
        </span>
      </div>

      <div className="mt-6">
        <h2 className="font-bold text-5xl text-white mb-3">{count}</h2>
        <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          type="button"
          className="flex-1 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md border-none text-white font-medium rounded-lg px-4 py-2 transition-all duration-300"
        >
          <Icon icon="heroicons-outline:eye" className="mr-2 h-5 w-5" />
          Lihat Detail
        </button>
      </div>
    </div>
  );
}
