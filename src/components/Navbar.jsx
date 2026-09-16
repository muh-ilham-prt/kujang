import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-user.jpg";
import logo from "../assets/logo.png";
import useSession from "../hooks/useSession";

export default function Navbar({ toggleSidebar }) {
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
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow rounded-b-3xl border-b-4 border-blue-500">
      <div className="px-5 py-2 flex items-center justify-between">
        {/* Left: hamburger icon */}
        <div className="flex items-center">
          <Icon
            icon="fa6-solid:bars"
            onClick={toggleSidebar}
            className="cursor-pointer size-4 text-dark"
          />
        </div>

        {/* Center: logo */}
        <div className="hidden md:flex flex-grow justify-center">
          <Link to="/dashboard">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </Link>
        </div>

        {/* Right: user name, avatar, dropdown */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-dark font-semibold text-sm">{userName}</span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="menu"
              className="flex items-center focus:outline-none hover:bg-gray-100 hover:rounded-full"
            >
              <img
                src={defaultAvatar}
                alt="User settings"
                className="cursor-pointer size-10 rounded-full object-cover"
              />
              <div className="flex justify-end text-dark">
                <Icon
                  icon="fa6-solid:caret-down"
                  className={`w-4 h-4 ml-2 transition-transform duration-500 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <Link
                  to="/dashboard"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md"
                >
                  Dashboard
                </Link>
                <Link
                  to="/auth/change-password"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md"
                >
                  Ganti Password
                </Link>
                <div className="border-t border-gray-100"></div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
