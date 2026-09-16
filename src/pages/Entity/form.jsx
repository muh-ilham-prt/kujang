import { Icon } from "@iconify/react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
// Bandung — fallback center when the form has no coordinates yet
const DEFAULT_CENTER = [-6.914722, 107.618611];

const markerIcon = new L.Icon({
  iconUrl: "https://api.iconify.design/fluent-emoji-flat:round-pushpin.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Click anywhere on the map to drop/move the marker.
function ClickPicker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Recenter when the picked coordinates change.
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 16));
  }, [position, map]);
  return null;
}

const EMPTY = {
  name: "",
  shortName: "",
  image: "",
  phone: "",
  address: "",
  lat: "",
  lon: "",
};
const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function EntityForm({ show, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState(EMPTY);
  const [preview, setPreview] = useState(null);
  const [geo, setGeo] = useState(null);
  const timer = useRef(null);
  const seq = useRef(0);

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
    setPreview(null);
    setGeo(null);
    clearTimeout(timer.current);
    seq.current++; // drop any in-flight lookup from the previous open
  }, [initialData, show]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Object URLs leak until revoked — drop the old one whenever the preview changes.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  if (!show) return null;
  const field = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const pickImage = (file) => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    field("image", file || "");
  };
  const pick = (lat, lon) =>
    setFormData((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lon: lon.toFixed(6),
    }));

  const lat = Number(formData.lat);
  const lon = Number(formData.lon);
  const position =
    formData.lat && formData.lon && !isNaN(lat) && !isNaN(lon)
      ? [lat, lon]
      : null;

  const searchAddress = async (query, request) => {
    setGeo("loading");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Geocoding failed");
      const [result] = await response.json();
      if (request !== seq.current) return;
      if (!result) return setGeo("notfound");
      pick(Number(result.lat), Number(result.lon));
      setGeo(null);
    } catch {
      if (request === seq.current) setGeo("error");
    }
  };

  const scheduleAddressSearch = (value) => {
    clearTimeout(timer.current);
    const request = ++seq.current;
    const query = value.trim();
    if (!query) return setGeo(null);
    timer.current = setTimeout(() => searchAddress(query, request), 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Entity" : "Tambah Entity"}
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
            <div>
              <span className={labelClass}>Image</span>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview image entity"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon
                      icon="fa6-solid:image"
                      className="h-6 w-6 text-slate-300"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="entity-image"
                    className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Icon icon="fa6-solid:upload" className="mr-2 h-3 w-3" />
                    Pilih Gambar
                  </label>
                  <input autoComplete="off"
                    id="entity-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImage(e.target.files?.[0])}
                    className="sr-only"
                  />
                  <p className="mt-2 truncate text-xs text-slate-500">
                    {formData.image?.name ||
                      formData.image ||
                      "Belum ada gambar dipilih"}
                  </p>
                  {preview && (
                    <button
                      type="button"
                      onClick={() => pickImage(null)}
                      className="mt-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Hapus gambar
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="entity-name" className={labelClass}>
                  Nama
                </label>
                <input autoComplete="off"
                  id="entity-name"
                  value={formData.name}
                  onChange={(e) => field("name", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="entity-short-name" className={labelClass}>
                  Nama Singkat
                </label>
                <input autoComplete="off"
                  id="entity-short-name"
                  value={formData.shortName}
                  onChange={(e) => field("shortName", e.target.value)}
                  maxLength={20}
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="entity-phone" className={labelClass}>
                Telepon
              </label>
              <input autoComplete="off"
                id="entity-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => field("phone", e.target.value)}
                pattern="[0-9+() -]{8,20}"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="entity-address" className={labelClass}>
                Alamat
              </label>
              <textarea autoComplete="off"
                id="entity-address"
                value={formData.address}
                onChange={(e) => field("address", e.target.value)}
                onKeyUp={(e) => scheduleAddressSearch(e.target.value)}
                rows={3}
                required
                className={inputClass}
              />
              {geo && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-1 text-xs text-slate-500"
                >
                  {geo === "loading" && "Mencari…"}
                  {geo === "notfound" && "Alamat tidak ditemukan"}
                  {geo === "error" && "Gagal menghubungi layanan peta"}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="entity-lat" className={labelClass}>
                  Latitude
                </label>
                <input autoComplete="off"
                  id="entity-lat"
                  value={formData.lat}
                  onChange={(e) => field("lat", e.target.value)}
                  placeholder="Contoh: -6.914722"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="entity-lon" className={labelClass}>
                  Longitude
                </label>
                <input autoComplete="off"
                  id="entity-lon"
                  value={formData.lon}
                  onChange={(e) => field("lon", e.target.value)}
                  placeholder="Contoh: 107.618611"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <span className={labelClass}>
                Location (klik peta atau geser penanda)
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
              type="button"
              onClick={onClose}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

