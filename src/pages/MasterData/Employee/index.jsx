import { Icon } from "@iconify/react";
import { useState } from "react";
import MultiSelect from "../../../components/MultiSelect";
import Pagination from "../../../components/Pagination";
import useLocalState from "../../../hooks/useLocalState";
import useSession, {
  can,
  inScope,
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";
import { useClients } from "../Client";
import { useLevels } from "../Level";
import { usePositions } from "../Position";
import EmployeeForm from "./form";
import EmployeeImport from "./components/import";
import * as XLSX from "xlsx";

const PER_PAGE = 10;
// matches the menu path in constants/menus.json
const PERM_PATH = "/master/employee";

const labelOf = (options, value) =>
  options.find((o) => o.value === String(value))?.label || "-";

// Employees come from this module — other modules read them instead of hardcoding options.
// NIP is the value because that is what other records reference.
export const useEmployees = () => {
  const [employees] = useLocalState("employees", []);
  const [session] = useSession();
  const clientOptions = useClients();
  return employees
    .filter((employee) => inScope(session, employee))
    .map((employee) => ({
      value: String(employee.mem_empy_nip),
      label: employee.mem_empy_name,
      client: labelOf(clientOptions, employee.mem_customer_id),
      entities: employee.entities || [],
    }));
};

// clients holds the selected ids; empty means no client filter
const EMPTY_FILTERS = { clients: [], search: "" };

const filterInputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none";

export default function Employee() {
  // No seeds — localStorage is the only source of data
  const [employees, setEmployees] = useLocalState("employees", []);
  const [session] = useSession();
  const canCreate = can(session, PERM_PATH, "create");
  const canUpdate = can(session, PERM_PATH, "update");
  const canDelete = can(session, PERM_PATH, "delete");
  const { entityNames } = useEntities();
  const clientOptions = useClients();
  const levelOptions = useLevels();
  const positionOptions = usePositions();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canSeeEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState(null);
  // One dialog serves delete / resend password / reset device
  const [confirm, setConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // ponytail: filtering + slicing client-side — move both server-side when the API lands
  const search = filters.search.toLowerCase();
  const filtered = employees.filter(
    (e) =>
      inScope(session, e) &&
      (!filters.clients.length ||
        filters.clients.includes(String(e.mem_customer_id))) &&
      (!search ||
        e.mem_empy_name.toLowerCase().includes(search) ||
        e.mem_empy_nip.toLowerCase().includes(search)),
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSubmit = (data) => {
    if (editing) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.mem_empy_id === editing.mem_empy_id ? { ...e, ...data } : e,
        ),
      );
      setSuccessMessage("Karyawan berhasil diperbarui");
    } else {
      setEmployees((prev) => [
        ...prev,
        {
          ...data,
          // Without a scope the new row would be invisible — inherit the creator's
          entities: data.entities?.length
            ? data.entities
            : session?.entities || [],
          mem_empy_id: Date.now(),
        },
      ]);
      setSuccessMessage("Karyawan berhasil ditambahkan");
    }
    setShowForm(false);
  };

  // ponytail: parse + upload happen server-side — post the file when the API lands
  const handleImport = (file) => {
    setShowImport(false);
    setSuccessMessage(`File ${file.name} siap diimport`);
  };

  const handleDelete = (employee) => {
    setEmployees((prev) =>
      prev.filter((e) => e.mem_empy_id !== employee.mem_empy_id),
    );
    setSuccessMessage("Karyawan berhasil dihapus");
  };

  const supervisorName = (nip) =>
    employees.find((e) => e.mem_empy_nip === nip)?.mem_empy_name || "-";

  // ponytail: switch to a real .xlsx export using xlsx library
  const exportExcel = () => {
    const headers = [
      "NIP",
      "Nama",
      "No. Telepon",
      "Atasan",
      "Level",
      "Jabatan",
      "Klien",
    ];
    const rows = filtered.map((e) => [
      e.mem_empy_nip,
      e.mem_empy_name,
      e.mem_account_phone,
      supervisorName(e.mem_empy_upper),
      labelOf(levelOptions, e.mem_empy_level),
      labelOf(positionOptions, e.mem_empy_position),
      labelOf(clientOptions, e.mem_customer_id),
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    // Set column widths
    ws["!cols"] = [
      { wch: 15 }, // NIP
      { wch: 25 }, // Nama
      { wch: 18 }, // No. Telepon
      { wch: 20 }, // Atasan
      { wch: 15 }, // Level
      { wch: 20 }, // Jabatan
      { wch: 20 }, // Klien
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Karyawan");
    XLSX.writeFile(wb, "karyawan.xlsx");
  };

  // ponytail: print dialog → "Save as PDF" — swap for a server-rendered PDF when the API lands
  const exportPdf = (employee) => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    // Employee fields are user input — escape before writing into the print window
    const esc = (s) =>
      String(s ?? "-").replace(/[<>&]/g, (c) => `&#${c.charCodeAt(0)};`);
    const rows = [
      ["NIP", employee.mem_empy_nip],
      ["Nama", employee.mem_empy_name],
      ["No. Telepon", employee.mem_account_phone],
      ["Atasan", supervisorName(employee.mem_empy_upper)],
      ["Level", labelOf(levelOptions, employee.mem_empy_level)],
      ["Jabatan", labelOf(positionOptions, employee.mem_empy_position)],
      ["Penempatan", labelOf(clientOptions, employee.mem_customer_id)],
    ];
    w.document.write(
      `<title>Data Karyawan - ${esc(employee.mem_empy_name)}</title>` +
        `<body style="font-family:sans-serif;padding:32px">` +
        `<h2>Data Karyawan</h2>` +
        `<table style="border-collapse:collapse;width:100%">` +
        rows
          .map(
            ([label, value]) =>
              `<tr><th style="border:1px solid #ccc;padding:8px;text-align:left;width:200px;background:#f8fafc">${label}</th>` +
              `<td style="border:1px solid #ccc;padding:8px">${esc(value)}</td></tr>`,
          )
          .join("") +
        `</table></body>`,
    );
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="min-h-screen mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Manajemen Karyawan</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportExcel}
            disabled={filtered.length === 0}
            className="flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            <Icon icon="fa6-solid:file-excel" className="mr-2 h-3 w-3" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Icon icon="fa6-solid:file-import" className="mr-2 h-3 w-3" />
            Import
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
            >
              <Icon icon="fa6-solid:plus" className="mr-2 h-3 w-3" />
              Tambah Karyawan
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Tutup notifikasi"
            className="text-green-800 hover:text-green-950"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <input
          autoComplete="off"
          type="text"
          aria-label="Cari Nama atau NIP"
          placeholder="Cari Nama atau NIP..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          className={filterInputClass}
        />
        <div className="w-52">
          <MultiSelect
            id="filter-client"
            options={clientOptions}
            value={filters.clients}
            onChange={(value) => setFilter("clients", value)}
            placeholder="Semua Penempatan"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="w-16 px-6 py-3">No</th>
              {canSeeEntities && <th className="px-6 py-3">Entity</th>}
              <th className="px-6 py-3">NIP</th>
              <th className="px-6 py-3">Nama</th>
              <th className="px-6 py-3">Penempatan</th>
              <th className="px-6 py-3">Level</th>
              <th className="px-6 py-3">Jabatan</th>
              <th className="px-6 py-3">Atasan</th>
              <th className="px-6 py-3">Telepon</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((employee, index) => (
              <tr
                key={employee.mem_empy_id}
                className="border-b border-slate-200 odd:bg-white even:bg-slate-50"
              >
                <td className="px-6 py-3">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                {canSeeEntities && (
                  <td className="px-6 py-3">
                    {entityNames(employee.entities)}
                  </td>
                )}
                <td className="px-6 py-3">{employee.mem_empy_nip}</td>
                <td className="px-6 py-3">{employee.mem_empy_name}</td>
                <td className="px-6 py-3">
                  {labelOf(clientOptions, employee.mem_customer_id)}
                </td>
                <td className="px-6 py-3">
                  {labelOf(levelOptions, employee.mem_empy_level)}
                </td>
                <td className="px-6 py-3">
                  {labelOf(positionOptions, employee.mem_empy_position)}
                </td>
                <td className="px-6 py-3">
                  {supervisorName(employee.mem_empy_upper)}
                </td>
                <td className="px-6 py-3">{employee.mem_account_phone}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      data-tooltip="Kirim Ulang Password"
                      aria-label="Kirim Ulang Password"
                      onClick={() =>
                        setConfirm({
                          title: "Kirim Ulang Password",
                          message: `Kirim ulang password ke WhatsApp ${employee.mem_empy_name} (${employee.mem_account_phone})?`,
                          confirmLabel: "Ya, Kirim",
                          onConfirm: () =>
                            setSuccessMessage(
                              `Password ${employee.mem_empy_name} berhasil dikirim ulang`,
                            ),
                        })
                      }
                      className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                    >
                      <Icon icon="fa6-brands:whatsapp" className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      data-tooltip="Reset Perangkat"
                      aria-label="Reset Perangkat"
                      onClick={() =>
                        setConfirm({
                          title: "Reset Perangkat",
                          message: `Reset perangkat terdaftar milik ${employee.mem_empy_name}? Karyawan harus login ulang di perangkat baru.`,
                          confirmLabel: "Ya, Reset",
                          onConfirm: () =>
                            setSuccessMessage(
                              `Perangkat ${employee.mem_empy_name} berhasil direset`,
                            ),
                        })
                      }
                      className="rounded-lg bg-purple-600 p-2 text-white hover:bg-purple-700"
                    >
                      <Icon
                        icon="fa6-solid:mobile-screen"
                        className="h-3 w-3"
                      />
                    </button>
                    <button
                      type="button"
                      data-tooltip="Export PDF"
                      aria-label="Export PDF"
                      onClick={() => exportPdf(employee)}
                      className="rounded-lg bg-slate-600 p-2 text-white hover:bg-slate-700"
                    >
                      <Icon icon="fa6-solid:file-pdf" className="h-3 w-3" />
                    </button>
                    {canUpdate && (
                      <button
                        type="button"
                        data-tooltip="Edit"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(employee);
                          setShowForm(true);
                        }}
                        className="rounded-lg bg-cyan-600 p-2 text-white hover:bg-cyan-700"
                      >
                        <Icon
                          icon="fa6-solid:pen-to-square"
                          className="h-3 w-3"
                        />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        data-tooltip="Hapus"
                        aria-label="Hapus"
                        onClick={() =>
                          setConfirm({
                            title: "Konfirmasi Hapus",
                            message: `Apakah Anda yakin ingin menghapus karyawan ${employee.mem_empy_name}?`,
                            confirmLabel: "Ya, Hapus",
                            onConfirm: () => handleDelete(employee),
                          })
                        }
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Icon icon="fa6-solid:trash" className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={canSeeEntities ? 10 : 9}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {employees.length === 0
                    ? "Belum ada data karyawan"
                    : "Tidak ada data yang cocok dengan filter"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        perPage={PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <EmployeeForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        employees={employees}
      />

      <EmployeeImport
        show={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {confirm.title}
              </h3>
            </div>
            <div className="px-6 py-4 text-dark">{confirm.message}</div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  confirm.onConfirm();
                  setConfirm(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {confirm.confirmLabel}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

