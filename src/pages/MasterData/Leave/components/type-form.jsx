import { useEffect, useState } from "react";
import Dropdown from "../../../../components/Dropdown";
import MultiSelect from "../../../../components/MultiSelect";
import useSession, {
  isSuperuser,
  useEntities,
} from "../../../../hooks/useSession";
import { QUOTA_PERIODS, inputClass, labelClass } from "../constants";

// Internal system key for a leave type — derived from the name so the system can
// find it reliably without trusting hand-typed labels. Never rendered.
const slugify = (name) =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EMPTY = {
  meat_abs_type_name: "",
  meat_abs_type_desc: "",
  meat_quota_default: 0,
  meat_quota_period: "Y",
  entities: [],
};

export default function LeaveTypeForm({
  show,
  onClose,
  onSubmit,
  initialData,
  types = [],
}) {
  const [formData, setFormData] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [session] = useSession();
  const { entityOptions } = useEntities();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
    setError(null);
  }, [initialData, show]);

  if (!show) return null;

  const field = (name, value) => setFormData({ ...formData, [name]: value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Slug is invisible, so surface the conflict in terms of the visible name.
    // A slug may repeat across entities — only a clash inside the same entity is an error.
    const slug = slugify(formData.meat_abs_type_name);
    const mine = (formData.entities || []).map(String);
    const sharesEntity = (t) =>
      (t.entities || []).map(String).some((id) => mine.includes(id));
    const duplicate = types.some(
      (t) =>
        t.meat_abs_type !== initialData?.meat_abs_type &&
        sharesEntity(t) &&
        (t.meat_abs_type_slug || slugify(t.meat_abs_type_name)) === slug
    );
    if (duplicate) {
      return setError(
        "Nama jenis cuti sudah terdaftar di entity ini. Gunakan nama lain."
      );
    }
    // Keep the existing scope untouched when the editor cannot change it
    onSubmit(
      canAssignEntities
        ? { ...formData, meat_abs_type_slug: slug }
        : {
            ...formData,
            meat_abs_type_slug: slug,
            entities: initialData?.entities || [],
          }
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
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

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
                <Dropdown
                  id="meat_quota_period"
                  options={QUOTA_PERIODS}
                  value={formData.meat_quota_period}
                  onChange={(value) => field("meat_quota_period", value)}
                  required
                />
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
