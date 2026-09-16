import { useEffect, useState } from "react";
import MultiSelect from "../../../components/MultiSelect";
import useLocalState from "../../../hooks/useLocalState";
import useSession, {
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";
import { SEED as ROLE_SEED, ensureSuperuser } from "../role";

// Roles come from the role module — a role must exist there before a user can hold it.
// The stored value is the lowercased name; Superuser keeps its own badge colour.
export const roleValue = (name) => name.toLowerCase();

export const useRoles = () => {
  const [stored] = useLocalState("roles", ROLE_SEED);
  return ensureSuperuser(stored).map((role) => ({
    value: roleValue(role.name),
    label: role.name,
    color: role.locked
      ? "bg-amber-100 text-amber-800"
      : "bg-slate-100 text-slate-800",
  }));
};

const EMPTY = {
  username: "",
  email: "",
  role: "",
  password: "",
  entities: [],
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function UserForm({ show, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState(EMPTY);
  // Superuser belongs to the built-in account alone — never offer it in the form
  const roles = useRoles().filter((role) => role.value !== "superuser");
  const [session] = useSession();
  const { entityOptions } = useEntities();
  // Only a superuser assigns entity scope to other accounts
  const canAssignEntities = isSuperuser(session);

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
            {initialData ? "Edit User" : "Tambah User"}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="username" className={labelClass}>
                  Username
                </label>
                <input
                  id="username"
                  value={formData.username}
                  onChange={(e) => field("username", e.target.value)}
                  placeholder="Masukkan Username"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => field("email", e.target.value)}
                  placeholder="nama@contoh.com"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className={labelClass}>
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => field("role", e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Pilih Role</option>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {canAssignEntities && (
              <div>
                <span className={labelClass}>Entity</span>
                <MultiSelect
                  id="entities"
                  options={entityOptions}
                  value={formData.entities}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => field("password", e.target.value)}
                placeholder="Masukkan Password"
                minLength={8}
                required={!initialData}
                className={inputClass}
              />
              {initialData && (
                <p className="mt-1 text-xs text-slate-500">
                  Kosongkan jika password tidak diubah.
                </p>
              )}
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
