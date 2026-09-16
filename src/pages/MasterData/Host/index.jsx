import { Icon } from "@iconify/react";
import { useState } from "react";
import MultiSelect from "../../../components/MultiSelect";
import Pagination from "../../../components/Pagination";
import useLocalState from "../../../hooks/useLocalState";
import useSession, {
  inScope,
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";
import { useClients } from "../Client";
import HostForm from "./form";

const PER_PAGE = 10;

const labelOf = (options, value) =>
  options.find((o) => o.value === String(value))?.label || "-";

// clients holds the selected ids; empty means no client filter
const EMPTY_FILTERS = { clients: [], search: "" };

const filterInputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";

export default function Host() {
  // No seeds — localStorage is the only source of data
  const [hosts, setHosts] = useLocalState("hosts", []);
  const [session] = useSession();
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
  const search = filters.search.toLowerCase();
  const filtered = hosts.filter(
    (h) =>
      inScope(session, h) &&
      (!filters.clients.length ||
        filters.clients.includes(String(h.mcr_customer))) &&
      (!search || h.mcr_cust_name.toLowerCase().includes(search))
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
      setHosts((prev) =>
        prev.map((h) =>
          h.mcr_resident_id === editing.mcr_resident_id ? { ...h, ...data } : h
        )
      );
      setSuccessMessage("Penerima tamu berhasil diperbarui");
    } else {
      setHosts((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length
            ? data.entities
            : session?.entities || [],
          mcr_resident_id: Date.now(),
        },
      ]);
      setSuccessMessage("Penerima tamu berhasil ditambahkan");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    setHosts((prev) =>
      prev.filter((h) => h.mcr_resident_id !== toDelete.mcr_resident_id)
    );
    setSuccessMessage("Penerima tamu berhasil dihapus");
    setToDelete(null);
  };

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">
          Manajemen Penerima Tamu
        </h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          <Icon icon="fa6-solid:plus" className="mr-2 h-3 w-3" />
          Tambah Penerima Tamu
        </button>
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
          type="text"
          aria-label="Cari Nama Penerima Tamu"
          placeholder="Cari nama penerima tamu..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          className={filterInputClass}
        />
        <div className="w-52">
          <MultiSelect
            id="filter-client"
            options={clientOptions}
            value={filters.clients}
            onChange={(value) => setFilter("clients", value)}
            placeholder="Semua Klien"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              <th className="px-6 py-3">Nama Penerima Tamu</th>
              <th className="px-6 py-3">Klien</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">No. Telepon</th>
              <th className="px-6 py-3">Divisi</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((host, index) => (
              <tr
                key={host.mcr_resident_id}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                <td className="px-6 py-3">{host.mcr_cust_name}</td>
                <td className="px-6 py-3">
                  {labelOf(clientOptions, host.mcr_customer)}
                </td>
                {canSeeEntities && (
                  <td className="px-6 py-3">{entityNames(host.entities)}</td>
                )}
                <td className="px-6 py-3">{host.mcm_phone_hp || "-"}</td>
                <td className="px-6 py-3">{host.mcm_division}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      data-tooltip="Edit"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(host);
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
                      onClick={() => setToDelete(host)}
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
                  {hosts.length === 0
                    ? "Belum ada data penerima tamu"
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

      <HostForm
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
              Apakah Anda yakin ingin menghapus penerima tamu{" "}
              <strong>{toDelete.mcr_cust_name}</strong>?
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
