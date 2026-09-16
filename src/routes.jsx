import Layout from "./Layout";
import Login from "./pages/Authentication";
import Dashboard from "./pages/Dashboard";
import Entity from "./pages/Entity";
import Client from "./pages/MasterData/Client";
import ClientGroup from "./pages/MasterData/ClientGroup";
import Employee from "./pages/MasterData/Employee";
import Host from "./pages/MasterData/Host";
import Leave from "./pages/MasterData/Leave";
import Level from "./pages/MasterData/Level";
import Location from "./pages/MasterData/Location";
import LocationType from "./pages/MasterData/LocationType";
import Position from "./pages/MasterData/Position";
import ShiftType from "./pages/MasterData/ShiftType";
import Visitor from "./pages/MasterData/Visitor";
import VisitorType from "./pages/MasterData/VisitorType";
import WorkShift from "./pages/MasterData/WorkShift";
import User from "./pages/User/master";
import Role from "./pages/User/role";
import PermissionPage from "./pages/User/permission";
import NotFound from "./pages/NotFound";
import ResetData from "./pages/ResetData";

// All routes of the app live here.
export default [
  { path: "/", element: <Login /> },
  { path: "/reset", element: <ResetData /> },
  {
    element: <Layout />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/entity", element: <Entity /> },
      { path: "/master/position", element: <Position /> },
      { path: "/master/level", element: <Level /> },
      { path: "/master/work-shift", element: <WorkShift /> },
      { path: "/master/shift-type", element: <ShiftType /> },
      { path: "/master/location", element: <Location /> },
      { path: "/master/location-type", element: <LocationType /> },
      { path: "/master/employee", element: <Employee /> },
      { path: "/master/client", element: <Client /> },
      { path: "/master/client-group", element: <ClientGroup /> },
      { path: "/master/host", element: <Host /> },
      { path: "/master/guest", element: <Visitor /> },
      { path: "/master/guest-type", element: <VisitorType /> },
      { path: "/master/leave", element: <Leave /> },
      { path: "/user", element: <User /> },
      { path: "/user/role", element: <Role /> },
      { path: "/user/permission", element: <PermissionPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

