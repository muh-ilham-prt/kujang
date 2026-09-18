import { Icon } from "@iconify/react";
import AttendanceCard from "./AttendanceCard";

// ponytail: static data — swap for a real attendance API call when the backend is ready
const ATTENDANCE = {
  totalEmployees: 0,
  present: { count: 0, percentage: "0" },
  leave: { count: 0, percentage: "0" },
  absent: { count: 0, percentage: "0" },
};

// ponytail: grayscale stands in for a real disabled state until the attendance API lands
export default function EmployeeAttendanceToday() {
  return (
    <div className="w-full bg-white rounded-xl py-6 shadow-lg flex flex-col gap-4 opacity-60 grayscale pointer-events-none">
      <div className="flex items-center justify-between border-b border-b-slate-300 pb-4 px-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-full">
            <Icon icon="heroicons-outline:user-group" className="h-6 w-6" />
          </div>
          <h5 className="text-2xl font-bold tracking-tight text-slate-900">
            Absensi Karyawan Hari Ini
          </h5>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
          <Icon icon="fa6-solid:lock" className="h-3 w-3" />
          Belum Aktif
        </span>
      </div>

      <div className="px-6 py-2">
        <div className="flex items-center justify-between mb-6 bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-full">
              <Icon icon="heroicons-outline:users" className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold text-purple-900">
              Total Karyawan:{" "}
              <span className="text-xl font-bold">
                {ATTENDANCE.totalEmployees}
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <AttendanceCard
            data-tooltip="Hadir"
            count={ATTENDANCE.present.count}
            percentage={ATTENDANCE.present.percentage}
            status="present"
          />
          <AttendanceCard
            data-tooltip="Izin/Cuti"
            count={ATTENDANCE.leave.count}
            percentage={ATTENDANCE.leave.percentage}
            status="leave"
          />
          <AttendanceCard
            data-tooltip="Tidak Hadir"
            count={ATTENDANCE.absent.count}
            percentage={ATTENDANCE.absent.percentage}
            status="absent"
          />
        </div>
      </div>
    </div>
  );
}