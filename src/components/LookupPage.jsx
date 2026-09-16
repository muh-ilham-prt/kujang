import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import MultiSelect from "./MultiSelect";
import Pagination from "./Pagination";
import useLocalState from "../hooks/useLocalState";
import useSession, {
  can,
  inScope,
  isSuperuser,
  useEntities,
} from "../hooks/useSession";

// A lookup is a name list other modules pick from — same shape every time,
// so one component serves all of them instead of four near-identical modules.

const PER_PAGE = 10;

// Options hook for a lookup, entity-scoped like every other cross-module hook.
export const makeLookupHook = (storageKey) => () => {
  const [rows] = useLocalState(storageKey, []);
  const [session] = useSession();
  return rows
    .filter((row) => inScope(session, row))
    .map((row) => ({ value: String(row.id), label: row.name }));
};

function LookupForm({ show, onClose, onSubmit, initialData, noun }) {
  const [formData, setFormData] = useState({ name: "", entities: [] });
  const [session] = useSession();
  const { entityOptions } = useEntities();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  useEffect(() => {
    setFormData(
      initialData
        ? { name: "", entities: [], ...initialData }
        : { name: "", entities: [] }
    );
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? `Edit ${noun}` : `Tambah ${noun}`}
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
            <div>
              <label
                htmlFor="lookup-name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Nama {noun}
              </label>
              <input autoComplete="off"
                id="lookup-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={`Masukkan Nama ${noun}`}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {canAssignEntities && (
              <div>
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Entity
                </span>
                <MultiSelect
                  id="lookup-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) =>
                    setFormData({ ...formData, entities: value })
                  }
                  placeholder="Pilih Entity"
                />
              </div>
            )}
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

export default function LookupPage({ title, noun, storageKey, permPath }) {
  // No seeds — localStorage is the only source of data
  const [rows, setRows] = useLocalState(storageKey, []);
  const [session] = useSession();
  const canCreate = can(session, permPath, "create");
  const canUpdate = can(session, permPath, "update");
  const canDelete = can(session, permPath, "delete");
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

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const query = search.toLowerCase();
  const filtered = rows.filter(
    (row) =>
      inScope(session, row) && (!query || row.name.toLowerCase().includes(query))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const handleSubmit = (data) => {
    if (editing) {
      setRows((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, ...data } : r))
      );
      setSuccessMessage(`${noun} berhasil diperbarui`);
    } else {
      setRows((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length
            ? data.entities
            : session?.entities || [],
          id: Date.now(),
        },
      ]);
      setSuccessMessage(`${noun} berhasil ditambahkan`);
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    setRows((prev) => prev.filter((r) => r.id !== toDelete.id));
    setSuccessMessage(`${noun} berhasil dihapus`);
    setToDelete(null);
  };

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
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
            Tambah {noun}
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

      <div className="mb-4 flex justify-end">
        <input autoComplete="off"
          type="text"
          aria-label={`Cari ${noun}`}
          placeholder={`Cari ${noun.toLowerCase()}...`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              <th className="px-6 py-3">Nama {noun}</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                <td className="px-6 py-3">{row.name}</td>
                {canSeeEntities && (
                  <td className="px-6 py-3">{entityNames(row.entities)}</td>
                )}
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {canUpdate && (
                      <button
                        type="button"
                        data-tooltip="Edit"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(row);
                          setShowForm(true);
                        }}
                        className="rounded-lg bg-cyan-600 p-2 text-white hover:bg-cyan-700"
                      >
                        <Icon icon="fa6-solid:pen-to-square" className="h-3 w-3" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        data-tooltip="Hapus"
                        aria-label="Hapus"
                        onClick={() => setToDelete(row)}
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Icon icon="fa6-solid:trash" className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={canSeeEntities ? 4 : 3}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {rows.length === 0
                    ? `Belum ada data ${noun.toLowerCase()}`
                    : "Tidak ada data yang cocok dengan pencarian"}
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

      <LookupForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        noun={noun}
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
              Apakah Anda yakin ingin menghapus {noun.toLowerCase()}{" "}
              <strong>{toDelete.name}</strong>?
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
