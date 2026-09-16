import LookupPage, { makeLookupHook } from "../../../components/LookupPage";

// Visitor types come from this module — other modules read them instead of hardcoding options.
export const useVisitorTypes = makeLookupHook("visitorTypes");

export default function VisitorType() {
  return (
    <LookupPage
      title="Manajemen Jenis Tamu"
      noun="Jenis Tamu"
      storageKey="visitorTypes"
      permPath="/master/guest-type"
    />
  );
}
