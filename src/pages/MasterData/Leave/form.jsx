import { useEffect, useState } from "react";
import { useEmployees } from "../Employee";
import { useLeaveTypes } from "./components/type-list";
import { LEAVE_STATUSES, inputClass, labelClass } from "./constants";

const EMPTY = {
  hal_empy_nip: "",
  hal_abs_type: "",
  hal_request_datefr: "",
  hal_request_dateto: "",
  hal_request_desc: "",
  hal_request_sts: "Open",
};

// End date is inclusive, so a same-day leave counts as 1 day.
const countDays = (from, to) => {
  if (!from || !to) return 0;
  const days = (new Date(to) - new Date(from)) / 86400000 + 1;
  return days > 0 ? days : 0;
};

export default function LeaveForm({ show, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState(EMPTY);
  const [error, setError] = useState(null);
  // Both lists are entity-scoped, so they follow the session automatically.
  // No Entity picker here — a leave inherits its scope from the chosen employee.
  const employees = useEmployees();
  const leaveTypes = useLeaveTypes();

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
    setError(null);
  }, [initialData, show]);

  if (!show) return null;

  const field = (name, value) => setFormData({ ...formData, [name]: value });
  const days = countDays(formData.hal_request_datefr, formData.hal_request_dateto);

  const handleSubmit = (e) => {
    e.preventDefault();
    // The date inputs cannot express "to >= from" on their own
    if (days === 0) return setError("Tanggal selesai harus setelah tanggal mulai");
    onSubmit({ ...formData, hal_request_days: days });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Pengajuan Cuti" : "Tambah Pengajuan Cuti"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="hal_empy_nip" className={labelClass}>
                  Karyawan
                </label>
                <select autoComplete="off"
                  id="hal_empy_nip"
                  value={formData.hal_empy_nip}
                  onChange={(e) => field("hal_empy_nip", e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Pilih Karyawan</option>
                  {employees.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="hal_abs_type" className={labelClass}>
                  Jenis Cuti
                </label>
                <select autoComplete="off"
                  id="hal_abs_type"
                  value={formData.hal_abs_type}
                  onChange={(e) => field("hal_abs_type", e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Pilih Jenis Cuti</option>
                  {leaveTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="hal_request_datefr" className={labelClass}>
                  Tanggal Mulai
                </label>
                <input autoComplete="off"
                  id="hal_request_datefr"
                  type="date"
                  value={formData.hal_request_datefr}
                  onChange={(e) => field("hal_request_datefr", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="hal_request_dateto" className={labelClass}>
                  Tanggal Selesai
                </label>
                <input autoComplete="off"
                  id="hal_request_dateto"
                  type="date"
                  value={formData.hal_request_dateto}
                  onChange={(e) => field("hal_request_dateto", e.target.value)}
                  min={formData.hal_request_datefr || undefined}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className={labelClass}>Jumlah Hari</span>
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {days} hari
                </p>
              </div>

              <div>
                <label htmlFor="hal_request_sts" className={labelClass}>
                  Status
                </label>
                <select autoComplete="off"
                  id="hal_request_sts"
                  value={formData.hal_request_sts}
                  onChange={(e) => field("hal_request_sts", e.target.value)}
                  required
                  className={inputClass}
                >
                  {LEAVE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="hal_request_desc" className={labelClass}>
                Keterangan
              </label>
              <textarea autoComplete="off"
                id="hal_request_desc"
                value={formData.hal_request_desc}
                onChange={(e) => field("hal_request_desc", e.target.value)}
                placeholder="Masukkan Keterangan"
                rows={3}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
