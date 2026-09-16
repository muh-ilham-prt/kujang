import LookupPage, { makeLookupHook } from "../../../components/LookupPage";

// Location types come from this module — other modules read them instead of hardcoding options.
export const useLocationTypes = makeLookupHook("locationTypes");

export default function LocationType() {
  return (
    <LookupPage
      title="Manajemen Jenis Lokasi"
      noun="Jenis Lokasi"
      storageKey="locationTypes"
      permPath="/master/location-type"
    />
  );
}
