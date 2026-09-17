import { useEffect, useState } from "react";
import defaultAvatar from "../../../assets/default-user.jpg";
import Dropdown from "../../../components/Dropdown";
import MultiSelect from "../../../components/MultiSelect";
import useSession, {
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";
import { useClients } from "../Client";
import { useLevels } from "../Level";
import { usePositions } from "../Position";

const EMPTY = {
  mem_empy_pict: "",
  mem_empy_nip: "",
  mem_empy_name: "",
  mem_account_phone: "",
  mem_empy_upper: "",
  mem_empy_level: "",
  mem_empy_position: "",
  mem_customer_id: "",
  entities: [],
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:bg-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function EmployeeForm({
  show,
  onClose,
  onSubmit,
  initialData,
  employees = [],
}) {
  const [formData, setFormData] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [session] = useSession();
  const { entityOptions, entityShortNames } = useEntities();
  // Every option list is entity-scoped, so it follows the session automatically.
  // Badge carries the entity so options spanning several entities aren't ambiguous in the dropdown
  const withBadge = (list) =>
    list.map((item) => ({ ...item, badge: entityShortNames(item.entities) }));
  const levels = withBadge(useLevels());
  const positions = withBadge(usePositions());
  const clients = withBadge(useClients());
  const selects = [
    ["mem_empy_level", "Level", levels, "Pilih Level"],
    ["mem_empy_position", "Jabatan", positions, "Pilih Jabatan"],
    ["mem_customer_id", "Penempatan", clients, "Pilih Penempatan"],
  ];
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
    setError(null);
  }, [initialData, show]);

  if (!show) return null;

  const field = (name, value) => setFormData({ ...formData, [name]: value });

  // ponytail: preview only — post the File to the upload endpoint when it exists
  const pickPicture = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    // Release the previous preview so blob URLs don't pile up
    if (formData.mem_empy_pict?.startsWith("blob:"))
      URL.revokeObjectURL(formData.mem_empy_pict);
    field("mem_empy_pict", URL.createObjectURL(picked));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // NIP is the employee's identity — it must be unique across all entities.
    // The NIP input is locked on edit, so any duplicate outside the row is an error.
    const nip = formData.mem_empy_nip.trim();
    const duplicate = employees.some(
      (emp) =>
        emp.mem_empy_id !== initialData?.mem_empy_id &&
        emp.mem_empy_nip === nip
    );
    if (duplicate) {
      return setError("NIP sudah terdaftar. Gunakan NIP lain.");
    }
    // Keep the existing scope untouched when the editor cannot change it
    onSubmit(
      canAssignEntities
        ? formData
        : { ...formData, entities: initialData?.entities || [] },
    );
  };

  // Anyone but the employee being edited can be their supervisor.
  const supervisors = employees.filter(
    (e) => e.mem_empy_nip !== initialData?.mem_empy_nip,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Karyawan" : "Tambah Karyawan"}
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
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <img
                src={formData.mem_empy_pict || defaultAvatar}
                alt="Foto profil"
                className="h-32 w-32 rounded-full object-cover"
              />
            </div>
            {canAssignEntities && (
              <div>
                <span className={labelClass}>Entity</span>
                <MultiSelect
                  id="employee-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mem_empy_pict" className={labelClass}>
                  Foto Profil
                </label>
                <input
                  autoComplete="off"
                  id="mem_empy_pict"
                  type="file"
                  accept="image/*"
                  onChange={pickPicture}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-cyan-600 file:px-3 file:py-1.5 file:text-sm file:text-white"
                />
              </div>

              <div>
                <label htmlFor="mem_empy_nip" className={labelClass}>
                  NIP
                </label>
                <input
                  autoComplete="off"
                  id="mem_empy_nip"
                  value={formData.mem_empy_nip}
                  onChange={(e) => field("mem_empy_nip", e.target.value)}
                  placeholder="Masukkan NIP"
                  // NIP is the identity key — locked once created
                  disabled={!!initialData}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mem_empy_name" className={labelClass}>
                  Nama
                </label>
                <input
                  autoComplete="off"
                  id="mem_empy_name"
                  value={formData.mem_empy_name}
                  onChange={(e) => field("mem_empy_name", e.target.value)}
                  placeholder="Masukkan Nama"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mem_account_phone" className={labelClass}>
                  Telepon
                </label>
                <input
                  autoComplete="off"
                  id="mem_account_phone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.mem_account_phone}
                  onChange={(e) => field("mem_account_phone", e.target.value)}
                  placeholder="Contoh: 6281234567890"
                  pattern="[0-9]{8,15}"
                  title="Hanya angka, 8-15 digit"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mem_empy_upper" className={labelClass}>
                  Atasan
                </label>
                <Dropdown
                  id="mem_empy_upper"
                  options={supervisors.map((e) => ({
                    value: e.mem_empy_nip,
                    label: e.mem_empy_name,
                  }))}
                  value={formData.mem_empy_upper}
                  onChange={(value) => field("mem_empy_upper", value)}
                  placeholder="Pilih Atasan"
                />
              </div>

              {selects.map(([name, label, options, placeholder]) => (
                <div key={name}>
                  <label htmlFor={name} className={labelClass}>
                    {label}
                  </label>
                  <Dropdown
                    id={name}
                    options={options}
                    value={formData[name]}
                    onChange={(value) => field(name, value)}
                    placeholder={placeholder}
                    required
                  />
                </div>
              ))}
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

