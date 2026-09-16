import { useEffect, useState } from "react";
import MultiSelect from "../../../components/MultiSelect";
import useSession, { isSuperuser, useEntities } from "../../../hooks/useSession";

const EMPTY = {
  mel_empy_level_name: "",
  mel_empy_level_short: "",
  entities: [],
};

export default function LevelForm({ show, onClose, onSubmit, initialData }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Keep the existing scope untouched when the editor cannot change it
    onSubmit(
      canAssignEntities
        ? formData
        : { ...formData, entities: initialData?.entities || [] }
    );
  };

  const field = (name, value) => setFormData({ ...formData, [name]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Level" : "Tambah Level"}
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
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Entity
                </span>
                <MultiSelect
                  id="level-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="mel_empy_level_name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Nama Level
              </label>
              <input autoComplete="off"
                id="mel_empy_level_name"
                value={formData.mel_empy_level_name}
                onChange={(e) => field("mel_empy_level_name", e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="mel_empy_level_short"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Singkatan Level
              </label>
              <input autoComplete="off"
                id="mel_empy_level_short"
                value={formData.mel_empy_level_short}
                onChange={(e) => field("mel_empy_level_short", e.target.value)}
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
