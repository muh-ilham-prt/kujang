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
import VisitorStatus from "./components/status";

const PER_PAGE = 10;
// matches the menu path in constants/menus.json
const PERM_PATH = "/master/guest";

// Visitor class drives both the badge colour and whether a vehicle is shown.
const CLASS_BADGE = {
  V: ["VIP", "bg-red-100 text-red-800"],
  U: ["Umum", "bg-green-100 text-green-800"],
};

// Identity numbers are sensitive — show only the last 4 digits.
const maskNik = (nik) =>
  !nik
    ? "-"
    : nik.length <= 4
      ? nik
      : "*".repeat(nik.length - 4) + nik.slice(-4);

const filterInputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";

export default function Visitor() {
  // No seeds — visitors are registered by the guard app, this page only reads them
  const [visitors, setVisitors] = useLocalState("visitors", []);
  const [session] = useSession();
  const canUpdate = can(session, PERM_PATH, "update");
  const canDelete = can(session, PERM_PATH, "delete");
  const { entityNames } = useEntities();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canSeeEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;
  const [editingStatus, setEditingStatus] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const query = search.toLowerCase();
  const filtered = visitors.filter(
    (v) =>
      inScope(session, v) &&
      (!query || v.mv_vist_name.toLowerCase().includes(query)),
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const handleStatusSubmit = (status) => {
    setVisitors((prev) =>
      prev.map((v) =>
        v.mv_vist_id === editingStatus.mv_vist_id
          ? { ...v, mv_vist_status: status }
          : v,
      ),
    );
    setSuccessMessage("Status tamu berhasil diubah");
    setEditingStatus(null);
  };

  const handleDelete = () => {
    setVisitors((prev) =>
      prev.filter((v) => v.mv_vist_id !== toDelete.mv_vist_id),
    );
    setSuccessMessage("Data tamu berhasil dihapus");
    setToDelete(null);
  };

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Manajemen Tamu</h1>
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
        <input
          autoComplete="off"
          type="text"
          aria-label="Cari Nama Tamu"
          placeholder="Cari dengan nama..."
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
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">Nama</th>
              <th className="px-6 py-3">Jenis Tamu</th>
              <th className="px-6 py-3">No. Identitas</th>
              <th className="px-6 py-3">Kendaraan</th>
              <th className="px-6 py-3">Perusahaan</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((visitor, index) => {
              const [classLabel, classColor] = CLASS_BADGE[
                visitor.mv_vist_class
              ] || [
                visitor.mv_vist_class || "-",
                "bg-slate-100 text-slate-800",
              ];
              return (
                <tr
                  key={visitor.mv_vist_id}
                  className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
                >
                  <td className="px-6 py-3">
                    {(currentPage - 1) * PER_PAGE + index + 1}
                  </td>
                  {canSeeEntities && (
                    <td className="px-6 py-3">
                      {entityNames(visitor.entities)}
                    </td>
                  )}
                  <td className="px-6 py-3">{visitor.mv_vist_name}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${classColor}`}
                    >
                      {classLabel}
                    </span>
                  </td>
                  <td className="px-6 py-3">{maskNik(visitor.mv_vist_nik)}</td>
                  <td className="px-6 py-3">
                    {/* Umum visitors are on foot — no vehicle recorded */}
                    {visitor.mv_vist_class !== "U"
                      ? visitor.mv_visit_vehicle || "-"
                      : "-"}
                  </td>
                  <td className="px-6 py-3">
                    {visitor.mv_vist_company || "-"}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        visitor.mv_vist_status === "A"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {visitor.mv_vist_status === "A" ? "Aktif" : "Blacklist"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {canUpdate && (
                        <button
                          type="button"
                          data-tooltip="Ubah Status"
                          aria-label="Ubah Status"
                          onClick={() => setEditingStatus(visitor)}
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
                          onClick={() => setToDelete(visitor)}
                          className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                        >
                          <Icon icon="fa6-solid:trash" className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={canSeeEntities ? 9 : 8}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {visitors.length === 0
                    ? "Belum ada data tamu"
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

      <VisitorStatus
        visitor={editingStatus}
        onClose={() => setEditingStatus(null)}
        onSubmit={handleStatusSubmit}
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
              Apakah Anda yakin ingin menghapus data tamu{" "}
              <strong>{toDelete.mv_vist_name}</strong>?
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

