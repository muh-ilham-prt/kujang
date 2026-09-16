// Shared between the Cuti list, its form, and the Jenis Cuti tab.

export const LEAVE_STATUSES = [
  { value: "Open", label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  { value: "Verified", label: "Terverifikasi", color: "bg-blue-100 text-blue-800" },
  { value: "Approved", label: "Disetujui", color: "bg-green-100 text-green-800" },
  { value: "Declined", label: "Ditolak", color: "bg-red-100 text-red-800" },
];

export const QUOTA_PERIODS = [
  { value: "Y", label: "Per Tahun" },
  { value: "M", label: "Per Bulan" },
];

export const optionOf = (options, value) =>
  options.find((o) => o.value === String(value));

export const labelOf = (options, value) =>
  optionOf(options, value)?.label || "-";

export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";
export const labelClass = "mb-1 block text-sm font-medium text-slate-700";
export const filterInputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";
