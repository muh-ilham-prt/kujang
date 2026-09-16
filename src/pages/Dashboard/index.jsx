import ChartAttendanceWeek from "./components/ChartAttendanceWeek";
import ChartEmployeePerCustomer from "./components/ChartEmployeePerCustomer";
import EmployeeAttendanceToday from "./components/EmployeeAttendanceToday";
import MapEmployee from "./components/MapEmployee";
import TopCard from "./components/TopCard";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* <TopCard countEmployee={0} /> */}
      <ChartEmployeePerCustomer />
      <EmployeeAttendanceToday />
      <ChartAttendanceWeek />
      <MapEmployee />
    </div>
  );
}

