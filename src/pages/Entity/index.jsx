import { Icon } from "@iconify/react";
import { useState } from "react";
import Pagination from "../../components/Pagination";
import useLocalState from "../../hooks/useLocalState";
import useSession, { isSuperuser } from "../../hooks/useSession";
import EntityForm from "./form";

const PER_PAGE = 10;
// No seeds — localStorage is the only source of data
export const SEED = [];
const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";
const formatDate = (value) => new Date(value).toLocaleDateString("id-ID");

export default function Entity() {
  const [entities, setEntities] = useLocalState("entities", SEED);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [session] = useSession();
  const query = search.toLowerCase();
  // An entity has no parent — a session sees the entities it belongs to, superuser sees all
  const visible = (entity) =>
    isSuperuser(session) ||
    (session?.entities || []).includes(String(entity.id));
  const filtered = entities.filter(
    (entity) =>
      visible(entity) &&
      (entity.name.toLowerCase().includes(query) ||
        entity.shortName.toLowerCase().includes(query)),
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const items = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const submit = (data) => {
    if (editing) {
      setEntities((prev) =>
        prev.map((entity) =>
          entity.id === editing.id
            ? {
                ...entity,
                ...data,
                image: data.image?.name ? data.image.name : editing.image,
              }
            : entity,
        ),
      );
      setNotice("Entity berhasil diperbarui");
    } else {
      setEntities((prev) => [
        ...prev,
        {
          ...data,
          id: Date.now(),
          image: data.image?.name || "",
          createdAt: new Date().toISOString(),
        },
      ]);
      setNotice("Entity berhasil ditambahkan");
    }
    setShowForm(false);
  };
  const remove = () => {
    setEntities((prev) => prev.filter((entity) => entity.id !== toDelete.id));
    setToDelete(null);
    setNotice("Entity berhasil dihapus");
  };

  return (
    <div className="mx-auto min-h-screen p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-primary">Manajemen Entity</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          <Icon icon="fa6-solid:plus" className="mr-2 h-3 w-3" />
          Tambah Entity
        </button>
      </div>
      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      )}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          aria-label="Cari Entity"
          placeholder="Cari nama atau nama singkat..."
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
              <th className="px-6 py-3">Nama Singkat</th>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Telepon</th>
              <th className="px-6 py-3">Alamat</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Created At</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((entity, index) => (
              <tr
                key={entity.id}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(page - 1) * PER_PAGE + index + 1}
                </td>
                <td className="px-6 py-3 font-medium">{entity.name}</td>
                <td className="px-6 py-3">{entity.shortName}</td>
                <td className="px-6 py-3">{entity.image || "-"}</td>
                <td className="px-6 py-3">{entity.phone}</td>
                <td className="px-6 py-3">{entity.address}</td>
                <td className="px-6 py-3">
                  {entity.lat && entity.lon
                    ? `${entity.lat}, ${entity.lon}`
                    : "-"}
                </td>
                <td className="px-6 py-3">{formatDate(entity.createdAt)}</td>
                <td className="px-6 py-3">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      data-tooltip="Edit"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(entity);
                        setShowForm(true);
                      }}
                      className="rounded-lg bg-cyan-600 p-2 text-white hover:bg-cyan-700"
                    >
                      <Icon
                        icon="fa6-solid:pen-to-square"
                        className="h-3 w-3"
                      />
                    </button>
                    <button
                      type="button"
                      data-tooltip="Hapus"
                      aria-label="Hapus"
                      onClick={() => setToDelete(entity)}
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
                  colSpan={9}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  Tidak ada data entity
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        perPage={PER_PAGE}
        onPageChange={setPage}
      />
      <EntityForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={submit}
        initialData={editing}
      />
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Konfirmasi Hapus
            </h3>
            <p className="mb-5 text-slate-700">
              Hapus entity <strong>{toDelete.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={remove}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                Ya, Hapus
              </button>
              <button
                type="button"
                onClick={() => setToDelete(null)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
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

