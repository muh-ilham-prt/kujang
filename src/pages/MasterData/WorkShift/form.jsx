import { useEffect, useState } from "react";
import MultiSelect from "../../../components/MultiSelect";
import useSession, { isSuperuser, useEntities } from "../../../hooks/useSession";
import { useClients } from "../Client";

// ponytail: static options — swap for fetchWorkHourTypes when the API lands
const SHIFT_TYPES = [
  { value: "1", label: "Reguler" },
  { value: "2", label: "Shift" },
];

const DAYS = [
  { label: "Senin", key: "mon" },
  { label: "Selasa", key: "tue" },
  { label: "Rabu", key: "wed" },
  { label: "Kamis", key: "thu" },
  { label: "Jumat", key: "fri" },
  { label: "Sabtu", key: "sat" },
  { label: "Minggu", key: "sun" },
];

const EMPTY = {
  gwh_whtype: "",
  gwh_customer: "",
  gwh_work_name: "",
  gwh_work_desc: "",
  gwh_minstart_time: "",
  gwh_start_time: "",
  gwh_maxstart_time: "",
  gwh_minend_time: "",
  gwh_end_time: "",
  gwh_maxend_time: "",
  gwh_work_sun: "Y",
  gwh_work_mon: "Y",
  gwh_work_tue: "Y",
  gwh_work_wed: "Y",
  gwh_work_thu: "Y",
  gwh_work_fri: "Y",
  gwh_work_sat: "Y",
  gwh_remark: "",
  entities: [],
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function WorkShiftForm({
  show,
  onClose,
  onSubmit,
  initialData,
}) {
  const [formData, setFormData] = useState(EMPTY);
  const [session] = useSession();
  const { entityOptions } = useEntities();
  const clients = useClients();
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
  }, [initialData, show]);

  if (!show) return null;

  const field = (name, value) => setFormData({ ...formData, [name]: value });
  const toggleDay = (key) =>
    field(`gwh_work_${key}`, formData[`gwh_work_${key}`] === "Y" ? "N" : "Y");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Keep the existing scope untouched when the editor cannot change it
    onSubmit(
      canAssignEntities
        ? formData
        : { ...formData, entities: initialData?.entities || [] }
    );
  };

  // Time field pairs rendered as a 2-column grid
  const timeRows = [
    [
      ["gwh_start_time", "Jam Masuk"],
      ["gwh_end_time", "Jam Pulang"],
    ],
    [
      ["gwh_minstart_time", "Min Jam Masuk"],
      ["gwh_maxstart_time", "Max Jam Masuk"],
    ],
    [
      ["gwh_minend_time", "Min Jam Pulang"],
      ["gwh_maxend_time", "Max Jam Pulang"],
    ],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Jam Kerja" : "Tambah Jam Kerja"}
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-4">
            <div>
              <label htmlFor="gwh_whtype" className={labelClass}>
                Tipe Jam Kerja
              </label>
              <select
                id="gwh_whtype"
                value={formData.gwh_whtype}
                onChange={(e) => field("gwh_whtype", e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Pilih Tipe Jam Kerja</option>
                {SHIFT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gwh_customer" className={labelClass}>
                Klien
              </label>
              <select
                id="gwh_customer"
                value={formData.gwh_customer}
                onChange={(e) => field("gwh_customer", e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih Klien</option>
                {clients.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {canAssignEntities && (
              <div>
                <span className={labelClass}>Entity</span>
                <MultiSelect
                  id="workshift-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            <div>
              <label htmlFor="gwh_work_name" className={labelClass}>
                Nama
              </label>
              <input
                id="gwh_work_name"
                value={formData.gwh_work_name}
                onChange={(e) => field("gwh_work_name", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="gwh_work_desc" className={labelClass}>
                Deskripsi
              </label>
              <input
                id="gwh_work_desc"
                value={formData.gwh_work_desc}
                onChange={(e) => field("gwh_work_desc", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {timeRows.map((row) => (
              <div key={row[0][0]} className="grid grid-cols-2 gap-4">
                {row.map(([name, label]) => (
                  <div key={name}>
                    <label htmlFor={name} className={labelClass}>
                      {label}
                    </label>
                    <input
                      id={name}
                      type="time"
                      value={formData[name]}
                      onChange={(e) => field(name, e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            ))}

            <fieldset className="space-y-2">
              <legend className={labelClass}>Hari Kerja</legend>
              <div className="grid grid-cols-3 gap-4">
                {DAYS.map((day) => (
                  <div key={day.key} className="flex items-center">
                    <input
                      id={`gwh_work_${day.key}`}
                      type="checkbox"
                      checked={formData[`gwh_work_${day.key}`] === "Y"}
                      onChange={() => toggleDay(day.key)}
                      className="mr-2 rounded-md"
                    />
                    <label
                      htmlFor={`gwh_work_${day.key}`}
                      className="text-sm text-slate-700"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="gwh_remark" className={labelClass}>
                Keterangan
              </label>
              <input
                id="gwh_remark"
                value={formData.gwh_remark}
                onChange={(e) => field("gwh_remark", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
