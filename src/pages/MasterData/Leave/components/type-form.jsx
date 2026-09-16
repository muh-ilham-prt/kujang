import { useEffect, useState } from "react";
import MultiSelect from "../../../../components/MultiSelect";
import useSession, {
  isSuperuser,
  useEntities,
} from "../../../../hooks/useSession";
import { QUOTA_PERIODS, inputClass, labelClass } from "../constants";

const EMPTY = {
  meat_abs_type_name: "",
  meat_abs_type_desc: "",
  meat_quota_default: 0,
  meat_quota_period: "Y",
  entities: [],
};

export default function LeaveTypeForm({ show, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState(EMPTY);
  const [session] = useSession();
  const { entityOptions } = useEntities();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
  }, [initialData, show]);

  if (!show) return null;

  const field = (name, value) => setFormData({ ...formData, [name]: value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Keep the existing scope untouched when the editor cannot change it
    onSubmit(
      canAssignEntities
        ? formData
        : { ...formData, entities: initialData?.entities || [] }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Jenis Cuti" : "Tambah Jenis Cuti"}
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
            {canAssignEntities && (
              <div>
                <span className={labelClass}>Entity</span>
                <MultiSelect
                  id="leavetype-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            <div>
              <label htmlFor="meat_abs_type_name" className={labelClass}>
                Nama Jenis Cuti
              </label>
              <input autoComplete="off"
                id="meat_abs_type_name"
                value={formData.meat_abs_type_name}
                onChange={(e) => field("meat_abs_type_name", e.target.value)}
                placeholder="Masukkan Nama Jenis Cuti"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="meat_abs_type_desc" className={labelClass}>
                Deskripsi
              </label>
              <textarea autoComplete="off"
                id="meat_abs_type_desc"
                value={formData.meat_abs_type_desc}
                onChange={(e) => field("meat_abs_type_desc", e.target.value)}
                placeholder="Masukkan Deskripsi"
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="meat_quota_default" className={labelClass}>
                  Quota Awal (hari)
                </label>
                <input autoComplete="off"
                  id="meat_quota_default"
                  type="number"
                  min={0}
                  value={formData.meat_quota_default}
                  onChange={(e) =>
                    field("meat_quota_default", Number(e.target.value) || 0)
                  }
                  placeholder="0 = tidak ada quota"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="meat_quota_period" className={labelClass}>
                  Periode Quota
                </label>
                <select autoComplete="off"
                  id="meat_quota_period"
                  value={formData.meat_quota_period}
                  onChange={(e) => field("meat_quota_period", e.target.value)}
                  required
                  className={inputClass}
                >
                  {QUOTA_PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
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
