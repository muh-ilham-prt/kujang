import { Icon } from "@iconify/react";
import { useState } from "react";
import Pagination from "../../../../components/Pagination";
import useLocalState from "../../../../hooks/useLocalState";
import useSession, {
  inScope,
  isSuperuser,
  useEntities,
} from "../../../../hooks/useSession";
import { QUOTA_PERIODS, filterInputClass, labelOf } from "../constants";
import LeaveTypeForm from "./type-form";

const PER_PAGE = 10;

// Leave types come from this tab — the Cuti tab reads them instead of hardcoding options.
export const useLeaveTypes = () => {
  const [types] = useLocalState("leaveTypes", []);
  const [session] = useSession();
  return types
    .filter((type) => inScope(session, type))
    .map((type) => ({
      value: String(type.meat_abs_type),
      label: type.meat_abs_type_name,
    }));
};

export default function LeaveTypeList({ onNotify }) {
  // No seeds — localStorage is the only source of data
  const [types, setTypes] = useLocalState("leaveTypes", []);
  const [session] = useSession();
  const { entityNames } = useEntities();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canSeeEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const query = search.toLowerCase();
  const filtered = types.filter(
    (t) =>
      inScope(session, t) &&
      (!query || t.meat_abs_type_name.toLowerCase().includes(query))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const handleSubmit = (data) => {
    if (editing) {
      setTypes((prev) =>
        prev.map((t) =>
          t.meat_abs_type === editing.meat_abs_type ? { ...t, ...data } : t
        )
      );
      onNotify("Jenis cuti berhasil diperbarui");
    } else {
      setTypes((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length
            ? data.entities
            : session?.entities || [],
          meat_abs_type: Date.now(),
        },
      ]);
      onNotify("Jenis cuti berhasil ditambahkan");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    setTypes((prev) =>
      prev.filter((t) => t.meat_abs_type !== toDelete.meat_abs_type)
    );
    onNotify("Jenis cuti berhasil dihapus");
    setToDelete(null);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          <Icon icon="fa6-solid:plus" className="mr-2 h-3 w-3" />
          Tambah Jenis Cuti
        </button>
        <input autoComplete="off"
          type="text"
          aria-label="Cari Jenis Cuti"
          placeholder="Cari jenis cuti..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className={filterInputClass}
        />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              <th className="px-6 py-3">Jenis Cuti</th>
              <th className="px-6 py-3">Deskripsi</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">Quota Awal</th>
              <th className="px-6 py-3">Periode Quota</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((type, index) => (
              <tr
                key={type.meat_abs_type}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                <td className="px-6 py-3">{type.meat_abs_type_name}</td>
                <td className="px-6 py-3">{type.meat_abs_type_desc || "-"}</td>
                {canSeeEntities && (
                  <td className="px-6 py-3">{entityNames(type.entities)}</td>
                )}
                <td className="px-6 py-3">
                  {type.meat_quota_default > 0
                    ? `${type.meat_quota_default} hari`
                    : "Tidak ada quota"}
                </td>
                <td className="px-6 py-3">
                  {labelOf(QUOTA_PERIODS, type.meat_quota_period)}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      data-tooltip="Edit"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(type);
                        setShowForm(true);
                      }}
                      className="rounded-lg bg-cyan-600 p-2 text-white hover:bg-cyan-700"
                    >
                      <Icon icon="fa6-solid:pen-to-square" className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      data-tooltip="Hapus"
                      aria-label="Hapus"
                      onClick={() => setToDelete(type)}
                      className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                    >
                      <Icon icon="fa6-solid:trash" className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={canSeeEntities ? 7 : 6}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {types.length === 0
                    ? "Belum ada data jenis cuti"
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

      <LeaveTypeForm
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
              Apakah Anda yakin ingin menghapus jenis cuti{" "}
              <strong>{toDelete.meat_abs_type_name}</strong>?
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
    </>
  );
}
