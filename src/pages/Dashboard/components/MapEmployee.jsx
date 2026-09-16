import { Icon } from "@iconify/react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { Link } from "react-router-dom";

// Jakarta — fallback center when no valid location exists
const DEFAULT_CENTER = [-6.264049980805431, 106.89399377988886];

// Iconify SVG API — swap the icon name in the URL to change the marker
const markerIcon = new L.Icon({
  iconUrl: "https://api.iconify.design/fluent-emoji-flat:police-officer.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// ponytail: static — swap for a real location-tracking API call when the backend is ready
const LOCATIONS = [
  { id: 1, name: "Karyawan 1", latitude: -6.6664353, longitude: 106.8519632 },
];

function BoundsUpdater({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds([]);
    locations.forEach((i) => bounds.extend([i.latitude, i.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
  }, [locations, map]);
  return null;
}

export default function MapEmployee() {
  return (
    <div className="w-full bg-white rounded-xl py-4 shadow-md flex flex-col gap-3 text-slate-900 overflow-hidden">
      <div className="flex items-center justify-between flex-wrap lg:flex-nowrap gap-3 border-b border-b-slate-300 pb-3 px-6">
        <div className="flex-1 flex gap-3 items-center">
          <div className="p-2 bg-purple-700 text-white rounded-full">
            <Icon icon="heroicons-outline:map" className="h-5 w-5" />
          </div>
          <div>
            <h5 className="self-end text-xl font-semibold tracking-tight text-slate-900">
              Peta Lokasi Karyawan
            </h5>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{LOCATIONS.length} karyawan aktif terdeteksi</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Icon icon="heroicons-outline:clock" className="w-3 h-3" />
                <span>Auto-refresh setiap 2 menit</span>
              </div>
            </div>
          </div>
        </div>

        <Link to="/map">
          <button
            type="button"
            className="flex items-center rounded-lg bg-purple-700 hover:bg-purple-800 px-3 py-2 text-sm font-medium text-white transition-colors"
          >
            <Icon icon="heroicons-outline:map" className="mr-2 h-4 w-4" />
            Buka Peta Penuh
          </button>
        </Link>
      </div>

      <div className="px-6">
        <div
          className="w-full rounded-lg overflow-hidden z-0 relative"
          style={{ height: "400px", maxWidth: "100%" }}
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={10}
            zoomControl
            maxZoom={20}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxNativeZoom={18}
              maxZoom={20}
            />
            {LOCATIONS.length > 0 && <BoundsUpdater locations={LOCATIONS} />}
            {LOCATIONS.map((item) => (
              <Marker
                key={item.id}
                position={[item.latitude, item.longitude]}
                icon={markerIcon}
              >
                <Popup>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {item.latitude}, {item.longitude}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {LOCATIONS.length === 0 && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <Icon
                  icon="heroicons-outline:map"
                  className="w-12 h-12 text-gray-400 mx-auto mb-3"
                />
                <p className="text-gray-500 text-sm">
                  Tidak ada data lokasi karyawan
                </p>
                <p className="text-gray-400 text-xs">
                  Karyawan belum melakukan aktivitas
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Total data: {LOCATIONS.length} karyawan</span>
          <span>Valid lokasi: {LOCATIONS.length} karyawan</span>
        </div>
      </div>
    </div>
  );
}
