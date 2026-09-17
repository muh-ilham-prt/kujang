import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-user.jpg";
import useSession from "../hooks/useSession";

export default function Navbar({ toggleSidebar, isSidebarOpen = true }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [session, setSession] = useSession();
  const userName = session?.username || "Admin";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setSession(null);
    navigate("/");
  };

  return (
    // Starts where the sidebar ends so the toggle is never hidden behind it
    <nav
      className={`fixed top-0 right-0 left-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "lg:left-60" : "lg:left-0"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: hamburger icon */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Buka menu"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-primary active:scale-95"
        >
          <Icon icon="fa6-solid:bars" className="size-4" />
        </button>

        <div className="flex-grow" />

        {/* Right: user name, avatar, dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-full py-1 pl-3 pr-2 transition hover:bg-slate-100 focus:outline-none"
          >
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {userName}
            </span>
            <img
              src={defaultAvatar}
              alt=""
              className="size-8 rounded-full object-cover ring-2 ring-primary/30"
            />
            <Icon
              icon="fa6-solid:caret-down"
              className={`size-3 text-slate-500 transition-transform duration-300 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 z-10 mt-2 w-52 animate-[card-in_0.15s_ease-out] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
              <p className="truncate border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                Masuk sebagai <span className="font-semibold text-slate-700">{userName}</span>
              </p>
              <Link
                to="/dashboard"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-primary/8 hover:text-primary"
              >
                <Icon icon="fa6-solid:gauge-high" className="size-3.5" />
                Dashboard
              </Link>
              <Link
                to="/auth/change-password"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-primary/8 hover:text-primary"
              >
                <Icon icon="fa6-solid:key" className="size-3.5" />
                Ganti Password
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <Icon icon="fa6-solid:right-from-bracket" className="size-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
