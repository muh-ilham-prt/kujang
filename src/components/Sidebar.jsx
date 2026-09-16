import { Icon } from "@iconify/react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import menus from "../constants/menus.json";
import useSession, { can } from "../hooks/useSession";

const rowClass = (isActive) =>
  `relative flex justify-between items-center px-4 py-[12px] text-base rounded-md cursor-pointer overflow-hidden
   transition-all duration-500 ease-in-out
   ${
     isActive
       ? "bg-primary/80 text-white shadow-sm rounded-xl"
       : "text-slate-700 hover:text-primary rounded-xl"
   }
   before:absolute before:inset-0 before:bg-primary/20
   before:translate-x-[-101%] hover:before:translate-x-0
   before:transition-all before:duration-300 before:ease-in-out`;

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
        <div
          className={rowClass(isActive).replace("py-[12px]", "py-[10px]")}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 flex items-center">
            {menu.icon && (
              <Icon
                icon={menu.icon}
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-white" : "text-primary"
                }`}
              />
            )}
            <span className="ml-3 flex-1">{menu.label}</span>
          </div>
          <div className="-m-px">
            <Icon
              icon="fa6-solid:chevron-down"
              className={`w-4 h-4 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      ) : (
        <Link to={menu.path} className="block" replace>
          <div className={rowClass(isActive)}>
            <div className="flex-1 flex items-center">
              {menu.icon && (
                <Icon
                  icon={menu.icon}
                  className={`w-3 h-3 shrink-0 ${
                    isActive ? "text-white" : "text-primary"
                  }`}
                />
              )}
              <span className="ml-3 flex-1">{menu.label}</span>
            </div>
            {isActive && (
              <div className="lg:hidden w-1.5 h-1.5 rounded-full bg-white mr-1" />
            )}
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
          <ul className="ml-6 space-y-[2px] overflow-hidden">
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
        h-full w-full lg:w-56 bg-white
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-all duration-500 ease-in-out z-10`}
    >
      {/* mt-20 clears the navbar, so the scroll area is the rest of the viewport */}
      <div className="overflow-y-auto px-2 pb-4 h-[calc(100%-5rem)] mt-20 scrollsidebarClass">
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

