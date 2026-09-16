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
import ClientForm from "./form";

const PER_PAGE = 10;
// matches the menu path in constants/menus.json
const PERM_PATH = "/master/client";

// Clients come from this module — other modules read them instead of hardcoding options.
export const useClients = () => {
  const [clients] = useLocalState("clients", []);
  const [session] = useSession();
  return clients
    .filter((client) => inScope(session, client))
    .map((client) => ({
      value: String(client.mcm_cust_id),
      label: client.mcm_cust_name,
    }));
};

const filterInputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";

export default function Client() {
  // No seeds — localStorage is the only source of data
  const [clients, setClients] = useLocalState("clients", []);
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

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const query = search.toLowerCase();
  const filtered = clients.filter(
    (c) =>
      inScope(session, c) &&
      (!query ||
        c.mcm_cust_name.toLowerCase().includes(query) ||
        c.mcm_cust_short.toLowerCase().includes(query))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const handleSubmit = (data) => {
    if (editing) {
      setClients((prev) =>
        prev.map((c) =>
          c.mcm_cust_id === editing.mcm_cust_id ? { ...c, ...data } : c
        )
      );
      setSuccessMessage("Klien berhasil diperbarui");
    } else {
      setClients((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length
            ? data.entities
            : session?.entities || [],
          mcm_cust_id: Date.now(),
        },
      ]);
      setSuccessMessage("Klien berhasil ditambahkan");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    setClients((prev) =>
      prev.filter((c) => c.mcm_cust_id !== toDelete.mcm_cust_id)
    );
    setSuccessMessage("Klien berhasil dihapus");
    setToDelete(null);
  };

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Manajemen Klien</h1>
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
          Tambah Klien
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
          aria-label="Cari Nama atau Kode Klien"
          placeholder="Cari Nama/Kode Klien..."
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
              <th className="px-6 py-3">Kode</th>
              <th className="px-6 py-3">Nama Klien</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">Alamat</th>
              <th className="px-6 py-3">Telepon</th>
              <th className="px-6 py-3">Radius</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((client, index) => (
              <tr
                key={client.mcm_cust_id}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                <td className="px-6 py-3">{client.mcm_cust_short}</td>
                <td className="px-6 py-3">{client.mcm_cust_name}</td>
                {canSeeEntities && (
                  <td className="px-6 py-3">{entityNames(client.entities)}</td>
                )}
                <td className="px-6 py-3">{client.mcm_address}</td>
                <td className="px-6 py-3">{client.mcm_phone || "-"}</td>
                <td className="px-6 py-3">
                  {client.mcm_cust_radius || "-"} meter
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      client.mcm_cust_status === "A"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {client.mcm_cust_status === "A" ? "Aktif" : "Tidak Aktif"}
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
                        setEditing(client);
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
                      onClick={() => setToDelete(client)}
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
                  colSpan={canSeeEntities ? 9 : 8}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {clients.length === 0
                    ? "Belum ada data klien"
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

      <ClientForm
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
              Apakah Anda yakin ingin menghapus klien{" "}
              <strong>{toDelete.mcm_cust_name}</strong>?
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
