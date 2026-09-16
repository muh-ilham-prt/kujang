import useLocalState from "./useLocalState";

// ponytail: demo session — a real backend must issue a token and verify it server-side.
// Holds the logged-in user; null when signed out.
export default function useSession() {
  return useLocalState("session", null);
}

export const isSuperuser = (session) => session?.role === "superuser";

// Rows carry the entities they belong to; a session only sees the ones it shares.
// ponytail: filtering here is cosmetic — the API must scope the query server-side.
export const inScope = (session, item) => {
  if (isSuperuser(session)) return true;
  const mine = session?.entities || [];
  return (item.entities || []).some((id) => mine.includes(String(id)));
};

// Entity column + multi-select need the same two things in every scoped module.
export const useEntities = () => {
  const [entities] = useLocalState("entities", []);
  return {
    entityOptions: entities.map((entity) => ({
      value: String(entity.id),
      label: entity.name,
    })),
    entityNames: (ids = []) =>
      ids
        .map((id) => entities.find((e) => String(e.id) === String(id))?.name)
        .filter(Boolean)
        .join(", ") || "-",
  };
};
