import LookupPage, { makeLookupHook } from "../../../components/LookupPage";

// Shift types come from this module — other modules read them instead of hardcoding options.
export const useShiftTypes = makeLookupHook("shiftTypes");

export default function ShiftType() {
  return (
    <LookupPage
      title="Manajemen Tipe Waktu Kerja"
      noun="Tipe Waktu Kerja"
      storageKey="shiftTypes"
    />
  );
}
