import { Icon } from "@iconify/react";
import { useState } from "react";
// ?url — Vite has no loader for .xlsx, so ask for the emitted asset URL
import templateFile from "../../../../assets/Template-Import-Karyawan.xlsx?url";

const ACCEPTED = [".xlsx", ".xls"];

// ponytail: static reference codes — swap for the same API calls the form uses
const CODE_GROUPS = [
  {
    title: "Level (Level)",
    rows: [
      ["1", "Direktur"],
      ["2", "Kepala Bagian"],
      ["3", "Pelaksana"],
    ],
  },
  {
    title: "Jabatan (Jabatan)",
    rows: [
      ["1", "Manajer"],
      ["2", "Staff"],
    ],
  },
  {
    title: "Penempatan (Penempatan)",
    rows: [
      ["1", "Klien A"],
      ["2", "Klien B"],
    ],
  },
  {
    title: "Perusahaan (Perusahaan)",
    rows: [["1", "PT Kujang"]],
  },
  {
    title: "Jam Kerja (Jam_Kerja)",
    rows: [
      ["1", "Reguler"],
      ["2", "Shift"],
    ],
  },
];

export default function EmployeeImport({ show, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [error, setError] = useState(null);

  if (!show) return null;

  const pickFile = (e) => {
    const picked = e.target.files?.[0] || null;
    // Browsers honour `accept` as a hint only — re-check the extension here
    if (
      picked &&
      !ACCEPTED.some((ext) => picked.name.toLowerCase().endsWith(ext))
    ) {
      setFile(null);
      setError("File harus berupa .xlsx atau .xls");
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(picked);
  };

  const handleImport = () => {
    if (!file) return setError("Silakan pilih file terlebih dahulu");
    onImport(file, { sendWhatsApp });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Import Data Karyawan
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
            <Icon
              icon="fa6-solid:circle-info"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <div>
              <p className="font-semibold">Sekedar informasi!</p>
              <p>
                Harap baca informasi kode di bawah ini sebelum mengimport data
                employee. Sesuaikan data pada excel dengan kode-kode yang
                terdapat pada Informasi Kode.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <input
                id="send-whatsapp"
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="rounded-md"
              />
              <label htmlFor="send-whatsapp" className="text-sm text-slate-700">
                Kirim password ke WhatsApp setelah import
              </label>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={!file}
              className="flex shrink-0 items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon icon="fa6-solid:file-import" className="mr-2 h-3 w-3" />
              Import
            </button>
          </div>

          <div>
            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={pickFile}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-cyan-600 file:px-3 file:py-1.5 file:text-sm file:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">
              File harus berupa .xlsx atau .xls
            </p>
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold text-slate-900">
              Informasi Kode
            </p>
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {CODE_GROUPS.map((group) => (
                <details key={group.title} className="group">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    {group.title}
                    <Icon
                      icon="fa6-solid:chevron-down"
                      className="h-3 w-3 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs uppercase">
                      <tr>
                        <th className="w-24 px-4 py-2">Kode</th>
                        <th className="px-4 py-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map(([code, description]) => (
                        <tr key={code} className="odd:bg-white even:bg-slate-50">
                          <td className="px-4 py-2">{code}</td>
                          <td className="px-4 py-2">{description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-slate-700">
              Silakan unduh template Excel di bawah ini:
            </p>
            <a
              href={templateFile}
              download="Template-Import-Karyawan.xlsx"
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Icon icon="fa6-solid:download" className="mr-2 h-3 w-3" />
              Download
            </a>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

