import LookupPage, { makeLookupHook } from "../../../components/LookupPage";

// Client groups come from this module — other modules read them instead of hardcoding options.
export const useClientGroups = makeLookupHook("clientGroups");

export default function ClientGroup() {
  return (
    <LookupPage
      title="Manajemen Grup Klien"
      noun="Grup Klien"
      storageKey="clientGroups"
      permPath="/master/client-group"
    />
  );
}
