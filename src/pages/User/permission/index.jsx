import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Dropdown from "../../../components/Dropdown";
import menus from "../../../constants/menus.json";
import useLocalState from "../../../hooks/useLocalState";
import { SEED as ROLE_SEED, ensureSuperuser } from "../role";

const ACTIONS = ["read", "create", "update", "delete", "other"];

const menuItems = menus.flatMap((menu) =>
  menu.children?.length
    ? menu.children.map((item) => ({ ...item, group: menu.label }))
    : menu.path
      ? [{ ...menu, group: "Menu Utama" }]
      : []
);

// Nothing granted by default — every box starts unchecked
const createPermissions = () =>
  Object.fromEntries(
    menuItems.map((item) => [
      item.path,
      Object.fromEntries(ACTIONS.map((action) => [action, false])),
    ])
  );

export default function PermissionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRole = location.state?.role;
  // Same key + seed as the role list, so a direct visit here never wipes the roles
  const [storedRoles, setRoles] = useLocalState("roles", ROLE_SEED);
  // Superuser is full-access by definition — keep it out of the editable list
  const roles = ensureSuperuser(storedRoles).filter((item) => !item.locked);
  const [role, setRole] = useState(selectedRole?.name || roles[0]?.name || "");
  // All roles live under one key: { [roleName]: { [path]: { read, create, ... } } }
  const [stored, setStored] = useLocalState("permissions", {});

  const permissions = stored[role] || createPermissions();

  const changeRole = (value) => setRole(value);

  const toggle = (path, action) => {
    setStored((prev) => {
      const current = prev[role] || createPermissions();
      return {
        ...prev,
        [role]: {
          ...current,
          [path]: { ...current[path], [action]: !current[path][action] },
        },
      };
    });
  };

  // Write one flag everywhere: whole table when path is omitted, one column otherwise
  const setAll = (checked, column) =>
    setStored((prev) => ({
      ...prev,
      [role]: Object.fromEntries(
        Object.entries(prev[role] || createPermissions()).map(([path, actions]) => [
          path,
          column
            ? { ...actions, [column]: checked }
            : Object.fromEntries(ACTIONS.map((action) => [action, checked])),
        ])
      ),
    }));

  const allChecked = Object.values(permissions).every((actions) =>
    Object.values(actions).every(Boolean)
  );
  const columnChecked = (action) =>
    Object.values(permissions).every((actions) => actions[action]);

  const save = () => {
    // Total Access on the role list = menus with at least one action granted
    const granted = Object.entries(permissions)
      .filter(([, actions]) => Object.values(actions).some(Boolean))
      .map(([path]) => path);
    setRoles((prev) =>
      prev.map((item) =>
        item.name === role ? { ...item, permissions: granted } : item
      )
    );
    // Straight back to the role list — the save notice lives there
    navigate("/user/role");
  };

  return (
    <div className="mx-auto min-h-screen p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/user/role")}
            aria-label="Kembali ke Role"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Kembali
          </button>
          <h1 className="text-2xl font-bold text-primary">Permission: {role}</h1>
        </div>
        {!selectedRole && (
          <div className="flex items-center gap-2">
            <label htmlFor="permission-role" className="text-sm font-medium text-slate-700">
              Role
            </label>
            <Dropdown
              id="permission-role"
              options={roles.map((item) => ({ value: item.name, label: item.name }))}
              value={role}
              onChange={changeRole}
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              <th className="min-w-56 px-6 py-3">
                <label className="flex cursor-pointer items-center gap-2 normal-case">
                  <input autoComplete="off"
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => setAll(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Pilih Semua
                </label>
              </th>
              {ACTIONS.map((action) => (
                <th key={action} className="min-w-24 px-4 py-3 text-center">
                  <label className="flex cursor-pointer flex-col items-center gap-1">
                    {action}
                    <input autoComplete="off"
                      type="checkbox"
                      aria-label={`Pilih semua ${action}`}
                      checked={columnChecked(action)}
                      onChange={(e) => setAll(e.target.checked, action)}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item, index) => (
              <tr key={item.path} className="border-b border-slate-200 odd:bg-white even:bg-slate-50">
                <td className="px-6 py-3">{index + 1}</td>
                <td className="px-6 py-3">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.group}</div>
                </td>
                {ACTIONS.map((action) => (
                  <td key={action} className="px-4 py-3 text-center">
                    <input autoComplete="off"
                      type="checkbox"
                      aria-label={`${item.label} ${action}`}
                      checked={permissions[item.path]?.[action] || false}
                      onChange={() => toggle(item.path, action)}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          Simpan Permission
        </button>
      </div>
    </div>
  );
}
