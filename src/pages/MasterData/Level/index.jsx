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
import LevelForm from "./form";

const PER_PAGE = 10;
// matches the menu path in constants/menus.json
const PERM_PATH = "/master/level";

// Levels come from this module — other modules read them instead of hardcoding options.
export const useLevels = () => {
  const [levels] = useLocalState("levels", []);
  const [session] = useSession();
  return levels
    .filter((level) => inScope(session, level))
    .map((level) => ({
      value: String(level.mel_empy_level_id),
      label: level.mel_empy_level_name,
      entities: level.entities || [],
    }));
};

export default function Level() {
  // No seeds — localStorage is the only source of data
  const [levels, setLevels] = useLocalState("levels", []);
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

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const filtered = levels.filter((level) => inScope(session, level));
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const handleSubmit = (data) => {
    if (editing) {
      setLevels((prev) =>
        prev.map((l) =>
          l.mel_empy_level_id === editing.mel_empy_level_id
            ? { ...l, ...data }
            : l,
        ),
      );
      setSuccessMessage("Level berhasil diperbarui");
    } else {
      setLevels((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length
            ? data.entities
            : session?.entities || [],
          mel_empy_level_id: Date.now(),
        },
      ]);
      setSuccessMessage("Level berhasil ditambahkan");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    setLevels((prev) =>
      prev.filter((l) => l.mel_empy_level_id !== toDelete.mel_empy_level_id),
    );
    setSuccessMessage("Level berhasil dihapus");
    setToDelete(null);
  };

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Manajemen Level</h1>
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
            Tambah Level
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

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">Nama Level</th>
              <th className="px-6 py-3">Singkatan</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((level, index) => (
              <tr
                key={level.mel_empy_level_id}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                {canSeeEntities && (
                  <td className="px-6 py-3">{entityNames(level.entities)}</td>
                )}
                <td className="px-6 py-3">{level.mel_empy_level_name}</td>
                <td className="px-6 py-3">{level.mel_empy_level_short}</td>
                <td className="flex items-center justify-center gap-2 px-6 py-3">
                  {canUpdate && (
                    <button
                      type="button"
                      data-tooltip="Edit"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(level);
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
                      onClick={() => setToDelete(level)}
                      className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                    >
                      <Icon icon="fa6-solid:trash" className="h-3 w-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={canSeeEntities ? 5 : 4}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  Belum ada data level
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

      <LevelForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        levels={levels}
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
              Apakah Anda yakin ingin menghapus level ini?
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

