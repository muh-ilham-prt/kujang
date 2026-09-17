import { useEffect, useState } from "react";
import Dropdown from "../../../../components/Dropdown";

const STATUSES = [
  { value: "A", label: "Aktif" },
  { value: "B", label: "Blacklist" },
];

export default function VisitorStatus({ visitor, onClose, onSubmit }) {
  const [status, setStatus] = useState("");

  useEffect(() => {
    setStatus(visitor?.mv_vist_status || "");
  }, [visitor]);

  if (!visitor) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Ubah Status Tamu
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
            <p className="text-sm text-slate-700">
              Ubah status untuk tamu{" "}
              <strong>{visitor.mv_vist_name}</strong>.
            </p>

            <div>
              <label htmlFor="mv_vist_status" className="mb-1 block text-sm font-medium text-slate-700">
                Status Baru
              </label>
              <Dropdown
                id="mv_vist_status"
                options={STATUSES}
                value={status}
                onChange={setStatus}
                placeholder="Pilih Status"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
            >
              Ubah Status
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
