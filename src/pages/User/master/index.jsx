import { Icon } from "@iconify/react";
import { useState } from "react";
import Pagination from "../../../components/Pagination";
import useLocalState from "../../../hooks/useLocalState";
import useSession, {
  can,
  inScope,
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";
import UserForm, { useRoles } from "./form";

const PER_PAGE = 10;
// matches the menu path in constants/menus.json
const PERM_PATH = "/user";

// The built-in account that owns the Superuser role. Not deletable.
// ponytail: password is a demo placeholder — the API must issue and hash it instead
const SUPER_USER = {
  id: 0,
  username: "Superuser",
  email: "super@himalaya.com",
  role: "superuser",
  password: "123456",
  createdAt: "2026-01-01",
  locked: true,
};

// Storage written before this account existed is missing it — put it back on read.
export const ensureSuperUser = (list) =>
  list.some((user) => user.locked) ? list : [SUPER_USER, ...list];

// Seed only — after the first render localStorage is the source of truth
export const SEED = [SUPER_USER];

const filterInputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("id-ID") : "-";

export default function User() {
  const [stored, setUsers] = useLocalState("users", SEED);
  const users = ensureSuperUser(stored);
  const ROLES = useRoles();
  const [session] = useSession();
  const canCreate = can(session, PERM_PATH, "create");
  const canUpdate = can(session, PERM_PATH, "update");
  const canDelete = can(session, PERM_PATH, "delete");
  const { entityNames } = useEntities();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canSeeEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const query = search.toLowerCase();
  const filtered = users.filter(
    (user) =>
      inScope(session, user) &&
      (!role || user.role === role) &&
      (!query ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)),
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const resetPage = () => setCurrentPage(1);

  const handleSubmit = (data) => {
    // Superuser is reserved for the built-in account
    if (data.role === "superuser") {
      setSuccessMessage("Role Superuser hanya untuk user bawaan");
      setShowForm(false);
      return;
    }
    if (editing) {
      setUsers((prev) =>
        // Locked accounts are read-only — skip them even if the form is reached
        prev.map((user) =>
          user.id === editing.id && !user.locked ? { ...user, ...data } : user,
        ),
      );
      setSuccessMessage("User berhasil diperbarui");
    } else {
      setUsers((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length ? data.entities : session?.entities || [],
          id: Date.now(),
          createdAt: new Date().toISOString(),
        },
      ]);
      setSuccessMessage("User berhasil ditambahkan");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (toDelete.locked) return;
    setUsers((prev) => prev.filter((user) => user.id !== toDelete.id));
    setSuccessMessage("User berhasil dihapus");
    setToDelete(null);
  };

  const roleOf = (value) => ROLES.find((r) => r.value === value);

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-primary">Manajemen User</h1>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            <Icon icon="fa6-solid:plus" className="mr-2 h-3 w-3" />
            Tambah User
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Tutup notifikasi"
            className="text-green-800 hover:text-green-950"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <input autoComplete="off"
          type="text"
          aria-label="Cari User"
          placeholder="Cari username atau email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          className={filterInputClass}
        />
        <select autoComplete="off"
          aria-label="Filter Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            resetPage();
          }}
          className={`${filterInputClass} w-48`}
        >
          <option value="">Semua Role</option>
          {ROLES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              <th className="px-6 py-3">Username</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">Created At</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((user, index) => {
              const userRole = roleOf(user.role);
              return (
                <tr
                  key={user.id}
                  className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
                >
                  <td className="px-6 py-3">
                    {(currentPage - 1) * PER_PAGE + index + 1}
                  </td>
                  <td className="px-6 py-3 font-medium">{user.username}</td>
                  <td className="px-6 py-3">{user.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        userRole?.color || "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {userRole?.label || user.role}
                    </span>
                  </td>
                  {canSeeEntities && (
                    <td className="px-6 py-3">{entityNames(user.entities)}</td>
                  )}
                  <td className="px-6 py-3">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {user.locked ? (
                        <span className="text-xs text-slate-400">
                          User bawaan
                        </span>
                      ) : (
                        <>
                          {canUpdate && (
                            <button
                              type="button"
                              data-tooltip="Edit"
                              aria-label="Edit"
                              onClick={() => {
                                setEditing(user);
                                setShowForm(true);
                              }}
                              className="rounded-lg bg-cyan-600 p-2 text-white hover:bg-cyan-700"
                            >
                              <Icon
                                icon="fa6-solid:pen-to-square"
                                className="h-3 w-3"
                              />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              data-tooltip="Hapus"
                              aria-label="Hapus"
                              onClick={() => setToDelete(user)}
                              className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                            >
                              <Icon icon="fa6-solid:trash" className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={canSeeEntities ? 7 : 6}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {users.length === 0
                    ? "Belum ada data user"
                    : "Tidak ada data yang cocok dengan filter"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        perPage={PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <UserForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        initialData={editing}
      />

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Konfirmasi Hapus
              </h3>
            </div>
            <div className="px-6 py-4 text-dark">
              Apakah Anda yakin ingin menghapus user{" "}
              <strong>{toDelete.username}</strong>?
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Ya, Hapus
              </button>
              <button
                type="button"
                onClick={() => setToDelete(null)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

