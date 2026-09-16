import { Icon } from "@iconify/react";
import { useState } from "react";
import MultiSelect from "../../../components/MultiSelect";
import Pagination from "../../../components/Pagination";
import useLocalState from "../../../hooks/useLocalState";
import useSession, {
  can,
  inScope,
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";
import { useClients } from "../Client";
import WorkShiftForm from "./form";

const PER_PAGE = 10;
// matches the menu path in constants/menus.json
const PERM_PATH = "/master/work-shift";

// ponytail: mirrors the form's static options — both come from the API later
const SHIFT_TYPES = [
  { value: "1", label: "Reguler" },
  { value: "2", label: "Shift" },
];

// clients holds the selected ids; empty means no client filter
const EMPTY_FILTERS = { clients: [], type: "", name: "" };

const filterInputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";

const labelOf = (options, value) =>
  options.find((option) => option.value === String(value))?.label || "-";

const COLUMNS = [
  ["gwh_work_name", "Nama"],
  ["gwh_minstart_time", "Minimal Jam Masuk"],
  ["gwh_start_time", "Jam Masuk"],
  ["gwh_maxstart_time", "Maksimal Jam Masuk"],
  ["gwh_minend_time", "Minimal Jam Pulang"],
  ["gwh_end_time", "Jam Pulang"],
  ["gwh_maxend_time", "Maksimal Jam Pulang"],
];

export default function WorkShift() {
  // No seeds — localStorage is the only source of data
  const [shifts, setShifts] = useLocalState("workShifts", []);
  const [session] = useSession();
  const canCreate = can(session, PERM_PATH, "create");
  const canUpdate = can(session, PERM_PATH, "update");
  const canDelete = can(session, PERM_PATH, "delete");
  const { entityNames } = useEntities();
  const clientOptions = useClients();
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
  const filtered = shifts.filter(
    (s) =>
      inScope(session, s) &&
      (!filters.clients.length ||
        filters.clients.includes(String(s.gwh_customer))) &&
      (!filters.type || String(s.gwh_whtype) === filters.type) &&
      (!filters.name ||
        s.gwh_work_name.toLowerCase().includes(filters.name.toLowerCase())),
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSubmit = (data) => {
    if (editing) {
      setShifts((prev) =>
        prev.map((s) => (s.gwh_id === editing.gwh_id ? { ...s, ...data } : s)),
      );
      setSuccessMessage("Jam kerja berhasil diperbarui");
    } else {
      setShifts((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length
            ? data.entities
            : session?.entities || [],
          gwh_id: Date.now(),
        },
      ]);
      setSuccessMessage("Jam kerja berhasil ditambahkan");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    setShifts((prev) => prev.filter((s) => s.gwh_id !== toDelete.gwh_id));
    setSuccessMessage("Jam kerja berhasil dihapus");
    setToDelete(null);
  };

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Manajemen Jam Kerja</h1>
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
            Tambah Jam Kerja
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

      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Klien
            </span>
            <MultiSelect
              id="filter-client"
              options={clientOptions}
              value={filters.clients}
              onChange={(value) => setFilter("clients", value)}
              placeholder="Semua Klien"
            />
          </div>

          <div>
            <label
              htmlFor="filter-type"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Tipe Jam Kerja
            </label>
            <select
              autoComplete="off"
              id="filter-type"
              value={filters.type}
              onChange={(e) => setFilter("type", e.target.value)}
              className={filterInputClass}
            >
              <option value="">Semua Tipe Jam Kerja</option>
              {SHIFT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nama Jam Kerja
            </label>
            <input
              autoComplete="off"
              id="filter-name"
              type="text"
              placeholder="Contoh: Shift 1"
              value={filters.name}
              onChange={(e) => setFilter("name", e.target.value)}
              className={filterInputClass}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setCurrentPage(1);
              }}
              className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Icon icon="fa6-solid:xmark" className="mr-2 h-3 w-3" />
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="whitespace-nowrap px-6 py-3">Nama</th>
              <th className="whitespace-nowrap px-6 py-3">Tipe Jam Kerja</th>
              <th className="whitespace-nowrap px-6 py-3">Klien</th>
              {COLUMNS.slice(1).map(([key, label]) => (
                <th key={key} className="whitespace-nowrap px-6 py-3">
                  {label}
                </th>
              ))}
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((shift, index) => (
              <tr
                key={shift.gwh_id}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                {canSeeEntities && (
                  <td className="px-6 py-3">{entityNames(shift.entities)}</td>
                )}
                <td className="whitespace-nowrap px-6 py-3">
                  {shift.gwh_work_name || "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-3">
                  {labelOf(SHIFT_TYPES, shift.gwh_whtype)}
                </td>
                <td className="whitespace-nowrap px-6 py-3">
                  {labelOf(clientOptions, shift.gwh_customer)}
                </td>
                {COLUMNS.slice(1).map(([key]) => (
                  <td key={key} className="whitespace-nowrap px-6 py-3">
                    {shift[key] || "-"}
                  </td>
                ))}
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {canUpdate && (
                      <button
                        type="button"
                        data-tooltip="Edit"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(shift);
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
                        onClick={() => setToDelete(shift)}
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
                  colSpan={COLUMNS.length + (canSeeEntities ? 5 : 4)}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {shifts.length === 0
                    ? "Belum ada data jam kerja"
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

      <WorkShiftForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        workShifts={shifts}
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
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{toDelete.gwh_work_name}</strong>?
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

