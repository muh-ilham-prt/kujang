import { Icon } from "@iconify/react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import menus from "../constants/menus.json";
import useSession, { can } from "../hooks/useSession";

const rowClass = (isActive) =>
  `group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer
   transition-all duration-200
   ${
     isActive
       ? "bg-linear-to-r from-primary to-purple-600 text-white shadow-md shadow-primary/30"
       : "text-slate-600 hover:bg-primary/8 hover:text-primary"
   }
   before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full
   before:bg-white/80 before:transition-opacity ${isActive ? "before:opacity-100" : "before:opacity-0"}`;

function MenuItem({ menu, canRead }) {
  const { pathname } = useLocation();
  const hasChild = menu.children?.length > 0;
  const isActive = hasChild
    ? menu.children.some((c) => pathname === c.path)
    : pathname === menu.path;
  const [expanded, setExpanded] = useState(isActive);

  return (
    <li>
      {hasChild ? (
        <div className={rowClass(isActive)} onClick={() => setExpanded(!expanded)}>
          <div className="flex flex-1 items-center gap-3">
            {menu.icon && (
              <Icon
                icon={menu.icon}
                className={`size-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-white" : "text-primary"
                }`}
              />
            )}
            <span className="flex-1 font-medium">{menu.label}</span>
          </div>
          <Icon
            icon="fa6-solid:chevron-down"
            className={`size-3 shrink-0 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      ) : (
        <Link to={menu.path} className="block" replace>
          <div className={rowClass(isActive)}>
            <div className="flex flex-1 items-center gap-3">
              {menu.icon && (
                <Icon
                  icon={menu.icon}
                  className={`size-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-primary"
                  }`}
                />
              )}
              <span className="flex-1">{menu.label}</span>
            </div>
          </div>
        </Link>
      )}

      {hasChild && (
        // Grid 0fr→1fr animates to the list's real height — a max-h cap would
        // clip the submenu once it outgrows the number.
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <ul className="ml-5 space-y-0.5 overflow-hidden border-l border-slate-200 pl-2">
            {menu.children
              .filter((child) => canRead(child.path))
              .map((child) => (
                <MenuItem key={child.path} menu={child} canRead={canRead} />
              ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function Sidebar({ isOpen = true }) {
  const [session] = useSession();
  const canRead = (path) => can(session, path, "read");
  return (
    <div
      className={`fixed top-0 bottom-0 left-0 right-0 lg:right-auto
        h-full w-full lg:w-60 border-r border-slate-200 bg-white lg:z-60
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out z-10`}
    >
      {/* Brand header — desktop only; on mobile the sidebar sits under the navbar */}
      <Link
        to="/dashboard"
        className="hidden h-[3.75rem] items-center gap-2 border-b border-slate-200 px-4 lg:flex"
      >
        <img src={logo} alt="Logo" className="size-9 shrink-0 object-contain" />
        <span className="truncate text-sm font-semibold text-slate-800">
          Kujang
        </span>
      </Link>

      <div className="scrollsidebarClass mt-20 h-[calc(100%-5rem)] overflow-y-auto px-3 py-4 lg:mt-0 lg:h-[calc(100%-3.75rem)]">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <ul className="space-y-1">
          {menus
            .filter((menu) =>
              menu.path
                ? canRead(menu.path)
                : menu.children?.some((child) => canRead(child.path))
            )
            .map((menu) => (
              <MenuItem key={menu.label} menu={menu} canRead={canRead} />
            ))}
        </ul>
      </div>
    </div>
  );
}

