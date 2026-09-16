import { Icon } from "@iconify/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MultiSelect from "../../../components/MultiSelect";
import Pagination from "../../../components/Pagination";
import useLocalState from "../../../hooks/useLocalState";
import useSession, {
  inScope,
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";

const PER_PAGE = 10;

// The built-in role: every menu, every action. Not editable, not deletable.
export const SUPERUSER = "Superuser";

// Seed only — after the first render localStorage is the source of truth
export const SEED = [
  { id: 0, name: SUPERUSER, permissions: [], entities: [], totalUsers: 1, locked: true },
];

// Storage written before Superuser existed is missing it — put it back on read.
export const ensureSuperuser = (list) =>
  list.some((role) => role.locked) ? list : [SEED[0], ...list];

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";

export default function Role() {
  const [stored, setRoles] = useLocalState("roles", SEED);
  const roles = ensureSuperuser(stored);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();
  const [session] = useSession();
  const { entityOptions, entityNames } = useEntities();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  const filtered = roles.filter(
    (role) =>
      inScope(session, role) &&
      role.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const items = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const deleteRole = () => {
    if (toDelete.locked) return;
    setRoles((prev) => prev.filter((role) => role.id !== toDelete.id));
    setToDelete(null);
    setNotice("Role berhasil dihapus");
  };

  const saveRole = (e) => {
    e.preventDefault();
    const name = editing.name.trim();
    if (!name) return;
    // Superuser is reserved — a second role by that name would inherit full access
    if (name.toLowerCase() === SUPERUSER.toLowerCase() && !editing.locked) {
      setNotice(`Nama "${SUPERUSER}" sudah digunakan role bawaan`);
      return;
    }
    // Keep the existing scope untouched when the editor cannot change it
    const entityIds = canAssignEntities ? editing.entities || [] : undefined;
    // Without a scope a new role would be invisible — inherit the creator's
    const newEntities = entityIds?.length ? entityIds : session?.entities || [];
    if (editing.id) {
      setRoles((prev) =>
        prev.map((role) =>
          role.id === editing.id
            ? { ...role, name, ...(entityIds && { entities: entityIds }) }
            : role
        )
      );
      setNotice("Role berhasil diperbarui");
    } else {
      setRoles((prev) => [
        ...prev,
        {
          id: Date.now(),
          name,
          permissions: [],
          entities: newEntities,
          totalUsers: 0,
        },
      ]);
      setNotice("Role berhasil ditambahkan");
    }
    setEditing(null);
  };

  return (
    <div className="mx-auto min-h-screen p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-primary">Manajemen Role</h1>
        <button
          type="button"
          onClick={() => setEditing({ name: "" })}
          className="flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          <Icon icon="fa6-solid:plus" className="mr-2 h-3 w-3" />
          Tambah Role
        </button>
      </div>

      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Tutup notifikasi">
            ✕
          </button>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <input
          type="text"
          aria-label="Cari Role"
          placeholder="Cari role..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              <th className="px-6 py-3">Nama</th>
              {canAssignEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">Permission</th>
              <th className="px-6 py-3">Total Access</th>
              <th className="px-6 py-3">Total Users</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((role, index) => (
              <tr key={role.id} className="border-b border-slate-200 odd:bg-white even:bg-slate-50">
                <td className="px-6 py-3">{(page - 1) * PER_PAGE + index + 1}</td>
                <td className="px-6 py-3 font-medium">{role.name}</td>
                {canAssignEntities && (
                  <td className="px-6 py-3">
                    {role.locked ? "Semua" : entityNames(role.entities)}
                  </td>
                )}
                <td className="px-6 py-3">
                  {role.locked ? (
                    <span className="text-xs text-slate-400">Akses penuh</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/user/permission", { state: { role } })}
                      className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-700"
                    >
                      Atur Permission
                    </button>
                  )}
                </td>
                <td className="px-6 py-3">
                  {role.locked ? "Semua" : role.permissions.length}
                </td>
                <td className="px-6 py-3">{role.totalUsers}</td>
                <td className="px-6 py-3">
                  <div className="flex justify-center gap-2">
                    {role.locked ? (
                      <span className="text-xs text-slate-400">Role bawaan</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          data-tooltip="Edit"
                          aria-label="Edit"
                          onClick={() => setEditing(role)}
                          className="rounded-lg bg-cyan-600 p-2 text-white hover:bg-cyan-700"
                        >
                          <Icon icon="fa6-solid:pen-to-square" className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          data-tooltip="Hapus"
                          aria-label="Hapus"
                          onClick={() => setToDelete(role)}
                          className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                        >
                          <Icon icon="fa6-solid:trash" className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={canAssignEntities ? 7 : 6} className="px-6 py-8 text-center text-slate-500">Tidak ada data role</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveRole} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              {editing.id ? "Edit Role" : "Tambah Role"}
            </h3>
            <label htmlFor="role-name" className="mb-1 block text-sm font-medium text-slate-700">
              Nama Role
            </label>
            <input
              id="role-name"
              value={editing.name}
              onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
              required
              autoFocus
              className={`${inputClass} mb-4 w-full`}
            />
            {canAssignEntities && (
              <div className="mb-5">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Entity
                </span>
                <MultiSelect
                  id="role-entities"
                  options={entityOptions}
                  value={editing.entities || []}
                  onChange={(value) =>
                    setEditing((prev) => ({ ...prev, entities: value }))
                  }
                  placeholder="Pilih Entity"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Simpan</button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">Batal</button>
            </div>
          </form>
        </div>
      )}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Konfirmasi Hapus</h3>
            <p className="mb-5 text-slate-700">Hapus role <strong>{toDelete.name}</strong>?</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={deleteRole} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">Ya, Hapus</button>
              <button type="button" onClick={() => setToDelete(null)} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
