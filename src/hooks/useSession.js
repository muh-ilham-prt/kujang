import useLocalState from "./useLocalState";

// ponytail: demo session — a real backend must issue a token and verify it server-side.
// Holds the logged-in user; null when signed out.
export default function useSession() {
  return useLocalState("session", null);
}

export const isSuperuser = (session) => session?.role === "superuser";

// Gate UI by the logged-in role's permission matrix: can(session, "/entity", "create").
// Only Superuser has implicit full access — any other role must have the flag checked.
export const can = (session, path, action) => {
  if (isSuperuser(session)) return true;
  const role = session?.role;
  if (!role) return false;
  const stored = JSON.parse(localStorage.getItem("permissions") || "{}");
  return stored[role]?.[path]?.[action] === true;
};

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
  const [session] = useSession();
  // A single-entity account never needs the entity badge/column to disambiguate anything
  const showEntities = isSuperuser(session) || (session?.entities?.length || 0) > 1;
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
    entityShortNames: (ids = []) =>
      showEntities
        ? ids
            .map(
              (id) => entities.find((e) => String(e.id) === String(id))?.shortName,
            )
            .filter(Boolean)
            .join(", ") || "-"
        : "",
  };
};
