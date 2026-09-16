import { useState } from "react";
import ChartAttendanceWeek from "./components/ChartAttendanceWeek";
import ChartEmployeePerCustomer from "./components/ChartEmployeePerCustomer";
import EmployeeAttendanceToday from "./components/EmployeeAttendanceToday";
import MapEmployee from "./components/MapEmployee";
import useLocalState from "../../hooks/useLocalState";
import useSession, { isSuperuser } from "../../hooks/useSession";

// Pill tabs let a multi-entity account flick between per-entity dashboards
// instead of seeing everything side-by-side. Single entity → no tabs.
const pillActive =
  "rounded-full bg-purple-700 px-4 py-2 text-sm font-medium text-white shadow-sm";
const pillIdle =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50";

export default function Dashboard() {
  const [session] = useSession();
  const [entities] = useLocalState("entities", []);
  // Superuser sees everything; scoped accounts only their assigned entities
  const mine = session?.entities || [];
  const allEntities =
    isSuperuser(session) && mine.length === 0
      ? entities
      : entities.filter((e) => mine.includes(String(e.id)));

  const [activeId, setActiveId] = useState(null);
  const active =
    allEntities.find((e) => String(e.id) === String(activeId)) ||
    allEntities[0];

  return (
    <div className="flex flex-col gap-4 p-4">
      {allEntities.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {allEntities.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => setActiveId(String(entity.id))}
              className={
                String(entity.id) === String(active?.id)
                  ? pillActive
                  : pillIdle
              }
            >
              {entity.name}
            </button>
          ))}
        </div>
      )}

      <ChartEmployeePerCustomer entityId={active?.id} />
      <EmployeeAttendanceToday />
      <ChartAttendanceWeek />
      <MapEmployee />
    </div>
  );
}