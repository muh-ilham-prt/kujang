import { useEffect, useState } from "react";
import MultiSelect from "../../../components/MultiSelect";
import useSession, { isSuperuser, useEntities } from "../../../hooks/useSession";

// Internal system key — derived from the name so the system can find a position
// reliably without trusting hand-typed labels. Never rendered.
export const slugify = (name) =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EMPTY = {
  mep_empy_position_name: "",
  mep_empy_position_short: "",
  entities: [],
};

export default function PositionForm({
  show,
  onClose,
  onSubmit,
  initialData,
  positions = [],
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
  const slug = slugify(formData.mep_empy_position_name);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Slug is invisible, so surface the conflict in terms of the visible name.
    // A slug may repeat across entities — only a clash inside the same entity is an error.
    const mine = (formData.entities || []).map(String);
    const sharesEntity = (p) =>
      (p.entities || []).map(String).some((id) => mine.includes(id));
    const duplicate = positions.some(
      (p) =>
        p.mep_empy_position_id !== initialData?.mep_empy_position_id &&
        sharesEntity(p) &&
        (p.mep_empy_position_slug || slugify(p.mep_empy_position_name)) === slug
    );
    if (duplicate) {
      return setError("Nama jabatan sudah terdaftar di entity ini. Gunakan nama lain.");
    }
    // Keep the existing scope untouched when the editor cannot change it
    onSubmit(
      canAssignEntities
        ? { ...formData, mep_empy_position_slug: slug }
        : {
            ...formData,
            mep_empy_position_slug: slug,
            entities: initialData?.entities || [],
          }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Jabatan" : "Tambah Jabatan"}
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
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Entity
                </span>
                <MultiSelect
                  id="position-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="mep_empy_position_name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Nama Jabatan
              </label>
              <input autoComplete="off"
                id="mep_empy_position_name"
                value={formData.mep_empy_position_name}
                onChange={(e) => field("mep_empy_position_name", e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="mep_empy_position_short"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Singkatan Jabatan
              </label>
              <input autoComplete="off"
                id="mep_empy_position_short"
                value={formData.mep_empy_position_short}
                onChange={(e) =>
                  field("mep_empy_position_short", e.target.value)
                }
                maxLength={10}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
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
