import { useEffect, useState } from "react";
import MultiSelect from "../../../components/MultiSelect";
import useSession, { isSuperuser, useEntities } from "../../../hooks/useSession";
import { useClients } from "../Client";

const EMPTY = {
  mcr_customer: "",
  mcr_cust_name: "",
  mcm_phone_hp: "",
  mcm_division: "",
  entities: [],
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function HostForm({ show, onClose, onSubmit, initialData }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Keep the existing scope untouched when the editor cannot change it
    onSubmit(
      canAssignEntities
        ? formData
        : { ...formData, entities: initialData?.entities || [] }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Penerima Tamu" : "Tambah Penerima Tamu"}
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
              <label htmlFor="mcr_customer" className={labelClass}>
                Klien
              </label>
              <select autoComplete="off"
                id="mcr_customer"
                value={formData.mcr_customer}
                onChange={(e) => field("mcr_customer", e.target.value)}
                required
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
                  id="host-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="mcr_cust_name" className={labelClass}>
                  Nama Penerima Tamu
                </label>
                <input autoComplete="off"
                  id="mcr_cust_name"
                  value={formData.mcr_cust_name}
                  onChange={(e) => field("mcr_cust_name", e.target.value)}
                  placeholder="Masukkan Nama Penerima Tamu"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mcm_phone_hp" className={labelClass}>
                  No. Telepon
                </label>
                <input autoComplete="off"
                  id="mcm_phone_hp"
                  type="tel"
                  inputMode="numeric"
                  value={formData.mcm_phone_hp}
                  onChange={(e) => field("mcm_phone_hp", e.target.value)}
                  placeholder="Contoh: 6281234567890"
                  pattern="[0-9]{8,15}"
                  title="Hanya angka, 8-15 digit"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="mcm_division" className={labelClass}>
                Divisi
              </label>
              <input autoComplete="off"
                id="mcm_division"
                value={formData.mcm_division}
                onChange={(e) => field("mcm_division", e.target.value)}
                placeholder="Masukkan Divisi"
                required
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
