import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Dropdown from "../../../components/Dropdown";
import MultiSelect from "../../../components/MultiSelect";
import useSession, {
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";
import { useClients } from "../Client";

// Internal system key — derived from the name so the system can find a location
// reliably without trusting hand-typed labels. Never rendered.
export const slugify = (name) =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Bandung — fallback center when the form has no coordinates yet
const DEFAULT_CENTER = [-6.914722, 107.618611];

const markerIcon = new L.Icon({
  iconUrl: "https://api.iconify.design/fluent-emoji-flat:round-pushpin.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const EMPTY = {
  mlm_loc_type: "",
  mlm_customer: "",
  mlm_loc_name: "",
  mlm_loc_short: "",
  mlm_loc_lat: "",
  mlm_loc_lon: "",
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

export default function LocationForm({
  show,
  onClose,
  onSubmit,
  initialData,
  locations = [],
  locationTypes = [],
}) {
  const [formData, setFormData] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [session] = useSession();
  const { entityOptions, entityShortNames } = useEntities();
  // Badge carries the entity so clients spanning several entities aren't ambiguous in the dropdown
  const clients = useClients().map((c) => ({
    ...c,
    badge: entityShortNames(c.entities),
  }));
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
    setError(null);
  }, [initialData, show]);

  if (!show) return null;

  const field = (name, value) => setFormData({ ...formData, [name]: value });
  const pick = (lat, lon) =>
    setFormData({
      ...formData,
      mlm_loc_lat: lat.toFixed(6),
      mlm_loc_lon: lon.toFixed(6),
    });

  const lat = Number(formData.mlm_loc_lat);
  const lon = Number(formData.mlm_loc_lon);
  const position =
    formData.mlm_loc_lat && formData.mlm_loc_lon && !isNaN(lat) && !isNaN(lon)
      ? [lat, lon]
      : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Slug is invisible, so surface the conflict in terms of the visible name.
    // A slug may repeat across entities — only a clash inside the same entity is an error.
    const slug = slugify(formData.mlm_loc_name);
    const mine = (formData.entities || []).map(String);
    const sharesEntity = (l) =>
      (l.entities || []).map(String).some((id) => mine.includes(id));
    const duplicate = locations.some(
      (l) =>
        l.mlm_loc_id !== initialData?.mlm_loc_id &&
        sharesEntity(l) &&
        (l.mlm_loc_slug || slugify(l.mlm_loc_name)) === slug,
    );
    if (duplicate) {
      return setError(
        "Nama lokasi sudah terdaftar di entity ini. Gunakan nama lain.",
      );
    }
    // Keep the existing scope untouched when the editor cannot change it
    onSubmit(
      canAssignEntities
        ? { ...formData, mlm_loc_slug: slug }
        : {
            ...formData,
            mlm_loc_slug: slug,
            entities: initialData?.entities || [],
          },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 z-30">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Lokasi" : "Tambah Lokasi"}
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
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {canAssignEntities && (
              <div>
                <span className={labelClass}>Entity</span>
                <MultiSelect
                  id="location-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mlm_loc_type" className={labelClass}>
                  Jenis Lokasi
                </label>
                <Dropdown
                  id="mlm_loc_type"
                  options={locationTypes}
                  value={formData.mlm_loc_type}
                  onChange={(value) => field("mlm_loc_type", value)}
                  placeholder="Pilih Jenis Lokasi"
                  required
                />
              </div>

              <div>
                <label htmlFor="mlm_customer" className={labelClass}>
                  Klien
                </label>
                <Dropdown
                  id="mlm_customer"
                  options={clients}
                  value={formData.mlm_customer}
                  onChange={(value) => field("mlm_customer", value)}
                  placeholder="Pilih Klien"
                  // Klien is mandatory only for CHECKPOINT
                  required={formData.mlm_loc_type === "2"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mlm_loc_name" className={labelClass}>
                  Nama Lokasi
                </label>
                <input
                  autoComplete="off"
                  id="mlm_loc_name"
                  value={formData.mlm_loc_name}
                  onChange={(e) => field("mlm_loc_name", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mlm_loc_short" className={labelClass}>
                  Singkatan Lokasi
                </label>
                <input
                  autoComplete="off"
                  id="mlm_loc_short"
                  value={formData.mlm_loc_short}
                  onChange={(e) => field("mlm_loc_short", e.target.value)}
                  maxLength={10}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mlm_loc_lat" className={labelClass}>
                  Latitude
                </label>
                <input
                  autoComplete="off"
                  id="mlm_loc_lat"
                  value={formData.mlm_loc_lat}
                  onChange={(e) => field("mlm_loc_lat", e.target.value)}
                  placeholder="Contoh: -6.914722"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mlm_loc_lon" className={labelClass}>
                  Longitude
                </label>
                <input
                  autoComplete="off"
                  id="mlm_loc_lon"
                  value={formData.mlm_loc_lon}
                  onChange={(e) => field("mlm_loc_lon", e.target.value)}
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
                  )}
                </MapContainer>
              </div>
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

