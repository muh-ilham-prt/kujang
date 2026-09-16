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
import { useEmployees } from "../Employee";
import LeaveTypeList, { useLeaveTypes } from "./components/type-list";
import {
  LEAVE_STATUSES,
  filterInputClass,
  labelOf,
  optionOf,
} from "./constants";
import LeaveForm from "./form";

const PER_PAGE = 10;
// matches the menu path in constants/menus.json
const PERM_PATH = "/master/leave";

const EMPTY_FILTERS = { status: "", search: "" };

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("id-ID") : "-";

export default function Leave() {
  const [tab, setTab] = useState("leave");
  // No seeds — localStorage is the only source of data
  const [leaves, setLeaves] = useLocalState("leaves", []);
    const [session] = useSession();
    const canCreate = can(session, PERM_PATH, "create");
    const canUpdate = can(session, PERM_PATH, "update");
    const canDelete = can(session, PERM_PATH, "delete");
  const { entityNames } = useEntities();
  const employeeOptions = useEmployees();
  const leaveTypeOptions = useLeaveTypes();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canSeeEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const search = filters.search.toLowerCase();
  const filtered = leaves.filter(
    (l) =>
      inScope(session, l) &&
      (!filters.status || l.hal_request_sts === filters.status) &&
      (!search ||
        labelOf(employeeOptions, l.hal_empy_nip)
          .toLowerCase()
          .includes(search) ||
        String(l.hal_empy_nip).includes(search))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSubmit = (data) => {
    if (editing) {
      setLeaves((prev) =>
        prev.map((l) =>
          l.hal_leave_id === editing.hal_leave_id ? { ...l, ...data } : l
        )
      );
      setSuccessMessage("Pengajuan cuti berhasil diperbarui");
    } else {
      setLeaves((prev) => [
        ...prev,
        {
          ...data,
          // A leave belongs where its employee does; fall back to the creator's scope
          entities: optionOf(employeeOptions, data.hal_empy_nip)?.entities
            ?.length
            ? optionOf(employeeOptions, data.hal_empy_nip).entities
            : session?.entities || [],
          hal_leave_id: Date.now(),
        },
      ]);
      setSuccessMessage("Pengajuan cuti berhasil ditambahkan");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    setLeaves((prev) =>
      prev.filter((l) => l.hal_leave_id !== toDelete.hal_leave_id)
    );
    setSuccessMessage("Pengajuan cuti berhasil dihapus");
    setToDelete(null);
  };

  const tabClass = (name) =>
    `px-4 py-2 text-sm font-medium border-b-2 ${
      tab === name
        ? "border-cyan-600 text-cyan-700"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="min-h-screen mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold text-primary">
        Manajemen Cuti &amp; Jenis Cuti
      </h1>

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

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("leave")}
          className={tabClass("leave")}
        >
          Cuti
        </button>
        <button
          type="button"
          onClick={() => setTab("type")}
          className={tabClass("type")}
        >
          Jenis Cuti
        </button>
      </div>

      {tab === "type" ? (
        <LeaveTypeList onNotify={setSuccessMessage} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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
              Tambah Pengajuan Cuti
            </button>
            )}
            <div className="flex flex-wrap gap-2">
              <input autoComplete="off"
                type="text"
                aria-label="Cari Karyawan"
                placeholder="Cari nama atau NIP..."
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                className={filterInputClass}
              />
              <select autoComplete="off"
                aria-label="Filter Status"
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
                className={`${filterInputClass} w-52`}
              >
                <option value="">Semua Status</option>
                {LEAVE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                <tr>
                  <th className="w-16 px-6 py-3">No</th>
                  <th className="px-6 py-3">NIP</th>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">Penempatan</th>
                  {canSeeEntities && <th className="px-6 py-3">Entity</th>}
                  <th className="px-6 py-3">Jenis Cuti</th>
                  <th className="px-6 py-3">Tanggal Mulai</th>
                  <th className="px-6 py-3">Tanggal Selesai</th>
                  <th className="px-6 py-3">Jumlah Hari</th>
                  <th className="px-6 py-3">Keterangan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((leave, index) => {
                  const employee = optionOf(employeeOptions, leave.hal_empy_nip);
                  const status = optionOf(LEAVE_STATUSES, leave.hal_request_sts);
                  return (
                    <tr
                      key={leave.hal_leave_id}
                      className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
                    >
                      <td className="px-6 py-3">
                        {(currentPage - 1) * PER_PAGE + index + 1}
                      </td>
                      <td className="px-6 py-3">{leave.hal_empy_nip}</td>
                      <td className="px-6 py-3">{employee?.label || "-"}</td>
                      <td className="px-6 py-3">{employee?.client || "-"}</td>
                      {canSeeEntities && (
                        <td className="px-6 py-3">
                          {entityNames(leave.entities)}
                        </td>
                      )}
                      <td className="px-6 py-3">
                        {labelOf(leaveTypeOptions, leave.hal_abs_type)}
                      </td>
                      <td className="px-6 py-3">
                        {formatDate(leave.hal_request_datefr)}
                      </td>
                      <td className="px-6 py-3">
                        {formatDate(leave.hal_request_dateto)}
                      </td>
                      <td className="px-6 py-3">{leave.hal_request_days} hari</td>
                      <td className="px-6 py-3">
                        {leave.hal_request_desc || "-"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            status?.color || "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {status?.label || leave.hal_request_sts}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {canUpdate && (
                          <button
                            type="button"
                            data-tooltip="Edit"
                            aria-label="Edit"
                            onClick={() => {
                              setEditing(leave);
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
                            onClick={() => setToDelete(leave)}
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
                      colSpan={canSeeEntities ? 12 : 11}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      {leaves.length === 0
                        ? "Belum ada data cuti"
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

          <LeaveForm
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
                  Apakah Anda yakin ingin menghapus pengajuan cuti{" "}
                  <strong>
                    {labelOf(employeeOptions, toDelete.hal_empy_nip)}
                  </strong>
                  ?
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
      )}
    </div>
  );
}
