import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MultiSelect from "../../../components/MultiSelect";
import useSession, { isSuperuser, useEntities } from "../../../hooks/useSession";

// ponytail: static options — swap for fetchClientGroups when the API lands
const CLIENT_GROUPS = [
  { value: "1", label: "Grup Retail" },
  { value: "2", label: "Grup Industri" },
];

// Bandung — fallback center when the form has no coordinates yet
const DEFAULT_CENTER = [-6.914722, 107.618611];

const markerIcon = new L.Icon({
  iconUrl: "https://api.iconify.design/fluent-emoji-flat:round-pushpin.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const EMPTY = {
  mcm_cust_short: "",
  mcm_cust_name: "",
  mcm_cust_group: "",
  mcm_cust_status: "A",
  mcm_address: "",
  mcm_city: "",
  mcm_prov: "",
  mcm_phone: "",
  mcm_cust_radius: 100,
  mcm_cust_lat: "",
  mcm_cust_lon: "",
  mcm_remarks: "",
  entities: [],
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

// Click anywhere on the map to drop/move the marker.
function ClickPicker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Recenter when the typed coordinates change.
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 16));
  }, [position, map]);
  return null;
}

export default function ClientForm({ show, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState(EMPTY);
  const [session] = useSession();
  const { entityOptions } = useEntities();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
  }, [initialData, show]);

  if (!show) return null;

  const field = (name, value) => setFormData({ ...formData, [name]: value });
  const pick = (lat, lon) =>
    setFormData({
      ...formData,
      mcm_cust_lat: lat.toFixed(6),
      mcm_cust_lon: lon.toFixed(6),
    });

  const lat = Number(formData.mcm_cust_lat);
  const lon = Number(formData.mcm_cust_lon);
  const position =
    formData.mcm_cust_lat && formData.mcm_cust_lon && !isNaN(lat) && !isNaN(lon)
      ? [lat, lon]
      : null;

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
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Klien" : "Tambah Klien"}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mcm_cust_short" className={labelClass}>
                  Kode Klien
                </label>
                <input autoComplete="off"
                  id="mcm_cust_short"
                  value={formData.mcm_cust_short}
                  onChange={(e) => field("mcm_cust_short", e.target.value)}
                  placeholder="Masukkan Kode Klien"
                  maxLength={10}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mcm_cust_name" className={labelClass}>
                  Nama Klien
                </label>
                <input autoComplete="off"
                  id="mcm_cust_name"
                  value={formData.mcm_cust_name}
                  onChange={(e) => field("mcm_cust_name", e.target.value)}
                  placeholder="Masukkan Nama Klien"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {canAssignEntities && (
              <div>
                <span className={labelClass}>Entity</span>
                <MultiSelect
                  id="client-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mcm_cust_group" className={labelClass}>
                  Grup Klien
                </label>
                <select autoComplete="off"
                  id="mcm_cust_group"
                  value={formData.mcm_cust_group}
                  onChange={(e) => field("mcm_cust_group", e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Pilih Grup</option>
                  {CLIENT_GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mcm_cust_status" className={labelClass}>
                  Status
                </label>
                <select autoComplete="off"
                  id="mcm_cust_status"
                  value={formData.mcm_cust_status}
                  onChange={(e) => field("mcm_cust_status", e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="A">Aktif</option>
                  <option value="N">Tidak Aktif</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="mcm_address" className={labelClass}>
                Alamat Lengkap
              </label>
              <textarea autoComplete="off"
                id="mcm_address"
                value={formData.mcm_address}
                onChange={(e) => field("mcm_address", e.target.value)}
                placeholder="Masukkan Alamat Lengkap"
                rows={3}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mcm_city" className={labelClass}>
                  Kota
                </label>
                <input autoComplete="off"
                  id="mcm_city"
                  value={formData.mcm_city}
                  onChange={(e) => field("mcm_city", e.target.value)}
                  placeholder="Masukkan Kota"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mcm_prov" className={labelClass}>
                  Provinsi
                </label>
                <input autoComplete="off"
                  id="mcm_prov"
                  value={formData.mcm_prov}
                  onChange={(e) => field("mcm_prov", e.target.value)}
                  placeholder="Masukkan Provinsi"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mcm_phone" className={labelClass}>
                  Telepon
                </label>
                <input autoComplete="off"
                  id="mcm_phone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.mcm_phone}
                  onChange={(e) => field("mcm_phone", e.target.value)}
                  placeholder="Contoh: 6281234567890"
                  pattern="[0-9]{8,15}"
                  title="Hanya angka, 8-15 digit"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mcm_cust_radius" className={labelClass}>
                  Radius Absensi (meter)
                </label>
                <input autoComplete="off"
                  id="mcm_cust_radius"
                  type="number"
                  value={formData.mcm_cust_radius}
                  onChange={(e) =>
                    field("mcm_cust_radius", Number(e.target.value) || 0)
                  }
                  min={10}
                  max={1000}
                  required
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Jarak maksimal dari titik lokasi untuk absensi (10-1000 meter)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mcm_cust_lat" className={labelClass}>
                  Latitude
                </label>
                <input autoComplete="off"
                  id="mcm_cust_lat"
                  value={formData.mcm_cust_lat}
                  onChange={(e) => field("mcm_cust_lat", e.target.value)}
                  placeholder="Contoh: -6.914722"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mcm_cust_lon" className={labelClass}>
                  Longitude
                </label>
                <input autoComplete="off"
                  id="mcm_cust_lon"
                  value={formData.mcm_cust_lon}
                  onChange={(e) => field("mcm_cust_lon", e.target.value)}
                  placeholder="Contoh: 107.618611"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <span className={labelClass}>
                Titik Lokasi (klik peta atau geser penanda)
              </span>
              <div
                className="relative z-0 w-full overflow-hidden rounded-lg"
                style={{ height: "300px" }}
              >
                <MapContainer
                  center={position || DEFAULT_CENTER}
                  zoom={position ? 16 : 12}
                  maxZoom={20}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxNativeZoom={18}
                    maxZoom={20}
                  />
                  <ClickPicker onPick={pick} />
                  <Recenter position={position} />
                  {position && (
                    <>
                      <Marker
                        position={position}
                        icon={markerIcon}
                        draggable
                        eventHandlers={{
                          dragend: (e) => {
                            const { lat, lng } = e.target.getLatLng();
                            pick(lat, lng);
                          },
                        }}
                      />
                      {/* The area a guard may check in from */}
                      <Circle
                        center={position}
                        radius={formData.mcm_cust_radius}
                        pathOptions={{ color: "#0891b2", fillOpacity: 0.15 }}
                      />
                    </>
                  )}
                </MapContainer>
              </div>
            </div>

            <div>
              <label htmlFor="mcm_remarks" className={labelClass}>
                Catatan
              </label>
              <textarea autoComplete="off"
                id="mcm_remarks"
                value={formData.mcm_remarks}
                onChange={(e) => field("mcm_remarks", e.target.value)}
                placeholder="Masukkan Catatan"
                rows={3}
                className={inputClass}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
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
