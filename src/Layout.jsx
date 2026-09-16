import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <>
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      <main
        className={`mt-20 p-2 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:ml-56" : "ml-0"
        }`}
      >
        <Outlet />
      </main>
    </>
  );
}
