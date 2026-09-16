import { Icon } from "@iconify/react";
import { useState } from "react";
import QRCode from "react-qr-code";
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
import LocationForm from "./form";

const PER_PAGE = 10;
// matches the menu path in constants/menus.json
const PERM_PATH = "/master/location";

// ponytail: mirrors the form's static options — both come from the API later
const LOCATION_TYPES = [
  { value: "1", label: "POS JAGA" },
  { value: "2", label: "CHECKPOINT" },
  { value: "3", label: "WAREHOUSE" },
  { value: "4", label: "COUNTER" },
];
const labelOf = (options, value) =>
  options.find((o) => o.value === String(value))?.label || "-";

// The payload the guard's mobile app scans at check-in.
const qrData = (loc) =>
  JSON.stringify({
    loc_id: loc.mlm_loc_id,
    loc_name: loc.mlm_loc_name,
    loc_short: loc.mlm_loc_short,
    loc_lat: loc.mlm_loc_lat,
    loc_long: loc.mlm_loc_lon,
  });

// A location without coordinates cannot be checked in against.
const hasCoordinates = (loc) =>
  !!loc.mlm_loc_lat?.trim() &&
  loc.mlm_loc_lat !== "-" &&
  !!loc.mlm_loc_lon?.trim() &&
  loc.mlm_loc_lon !== "-";

// clients holds the selected ids; empty means no client filter
const EMPTY_FILTERS = { clients: [], type: "", search: "" };

const filterInputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";

export default function Location() {
  // No seeds — localStorage is the only source of data
  const [locations, setLocations] = useLocalState("locations", []);
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
  const [qrLocation, setQrLocation] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const search = filters.search.toLowerCase();
  const filtered = locations.filter(
    (l) =>
      inScope(session, l) &&
      (!filters.clients.length ||
        filters.clients.includes(String(l.mlm_customer))) &&
      (!filters.type || String(l.mlm_loc_type) === filters.type) &&
      (!search ||
        l.mlm_loc_name.toLowerCase().includes(search) ||
        l.mlm_loc_short.toLowerCase().includes(search))
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
      setLocations((prev) =>
        prev.map((l) =>
          l.mlm_loc_id === editing.mlm_loc_id ? { ...l, ...data } : l
        )
      );
      setSuccessMessage("Lokasi berhasil diperbarui");
    } else {
      setLocations((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length
            ? data.entities
            : session?.entities || [],
          mlm_loc_id: Date.now(),
        },
      ]);
      setSuccessMessage("Lokasi berhasil ditambahkan");
    }
    setShowForm(false);
  };

  // Print the SVG already rendered in the modal — no second QR render needed.
  const printQr = () => {
    const svg = document.getElementById("qr-print-source")?.innerHTML;
    if (!svg) return;
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return;
    // Location names are user input — escape before writing into the print window
    const esc = (s) => String(s).replace(/[<>&]/g, (c) => `&#${c.charCodeAt(0)};`);
    const title = `${esc(qrLocation.mlm_loc_name)} (${esc(qrLocation.mlm_loc_short)})`;
    w.document.write(
      `<title>QR Code - ${title}</title>` +
        `<body style="text-align:center;font-family:sans-serif">` +
        `<h2>${title}</h2>${svg}</body>`
    );
    w.document.close();
    w.focus();
    w.print();
  };

  const handleDelete = () => {
    setLocations((prev) =>
      prev.filter((l) => l.mlm_loc_id !== toDelete.mlm_loc_id)
    );
    setSuccessMessage("Lokasi berhasil dihapus");
    setToDelete(null);
  };

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Manajemen Lokasi</h1>
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
          Tambah Lokasi
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
              Jenis Lokasi
            </label>
            <select autoComplete="off"
              id="filter-type"
              value={filters.type}
              onChange={(e) => setFilter("type", e.target.value)}
              className={filterInputClass}
            >
              <option value="">Semua Jenis Lokasi</option>
              {LOCATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Pencarian
            </label>
            <input autoComplete="off"
              id="filter-search"
              type="text"
              placeholder="Cari nama lokasi atau singkatan..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
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
              <th className="px-6 py-3">Nama Lokasi</th>
              <th className="px-6 py-3">Singkatan</th>
              <th className="px-6 py-3">Jenis Lokasi</th>
              <th className="px-6 py-3">Klien</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">Latitude</th>
              <th className="px-6 py-3">Longitude</th>
              <th className="px-6 py-3 text-center">QR Code</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((loc, index) => (
              <tr
                key={loc.mlm_loc_id}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                <td className="px-6 py-3">{loc.mlm_loc_name}</td>
                <td className="px-6 py-3">{loc.mlm_loc_short}</td>
                <td className="px-6 py-3">
                  {labelOf(LOCATION_TYPES, loc.mlm_loc_type)}
                </td>
                <td className="px-6 py-3">
                  {labelOf(clientOptions, loc.mlm_customer)}
                </td>
                {canSeeEntities && (
                  <td className="px-6 py-3">{entityNames(loc.entities)}</td>
                )}
                <td className="px-6 py-3">{loc.mlm_loc_lat || "-"}</td>
                <td className="px-6 py-3">{loc.mlm_loc_lon || "-"}</td>
                <td className="px-6 py-3">
                  {hasCoordinates(loc) ? (
                    <button
                      type="button"
                      data-tooltip="Lihat QR"
                      aria-label={`Lihat QR ${loc.mlm_loc_name}`}
                      onClick={() => setQrLocation(loc)}
                      className="mx-auto block rounded bg-white p-1"
                    >
                      <QRCode value={qrData(loc)} size={56} />
                    </button>
                  ) : (
                    <span className="block text-center text-xs text-slate-400">
                      Koordinat belum diisi
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      data-tooltip="Lihat QR"
                      aria-label="Lihat QR"
                      onClick={() => setQrLocation(loc)}
                      disabled={!hasCoordinates(loc)}
                      className="rounded-lg bg-slate-700 p-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon icon="fa6-solid:qrcode" className="h-3 w-3" />
                    </button>
                    {canUpdate && (
                    <button
                      type="button"
                      data-tooltip="Edit"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(loc);
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
                      onClick={() => setToDelete(loc)}
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
                  colSpan={canSeeEntities ? 10 : 9}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {locations.length === 0
                    ? "Belum ada data lokasi"
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

      <LocationForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        initialData={editing}
      />

      {qrLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                QR Code - {qrLocation.mlm_loc_name} ({qrLocation.mlm_loc_short})
              </h3>
              <button
                type="button"
                onClick={() => setQrLocation(null)}
                aria-label="Tutup"
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center px-6 py-6">
              <div id="qr-print-source">
                <QRCode value={qrData(qrLocation)} size={256} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={printQr}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
              >
                Cetak QR
              </button>
              <button
                type="button"
                onClick={() => setQrLocation(null)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Konfirmasi Hapus
              </h3>
            </div>
            <div className="px-6 py-4 text-dark">
              Apakah Anda yakin ingin menghapus lokasi{" "}
              <strong>{toDelete.mlm_loc_name}</strong>?
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
