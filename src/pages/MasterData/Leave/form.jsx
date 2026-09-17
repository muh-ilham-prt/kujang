import { useEffect, useState } from "react";
import Dropdown from "../../../components/Dropdown";
import MultiSelect from "../../../components/MultiSelect";
import useSession, {
  isSuperuser,
  useEntities,
} from "../../../hooks/useSession";
import { useEmployees } from "../Employee";
import { useLeaveTypes } from "./components/type-list";
import { LEAVE_STATUSES, inputClass, labelClass } from "./constants";

const EMPTY = {
  hal_empy_nip: "",
  hal_abs_type: "",
  hal_request_datefr: "",
  hal_request_dateto: "",
  hal_request_desc: "",
  hal_request_sts: "Open",
  entities: [],
};

// End date is inclusive, so a same-day leave counts as 1 day.
const countDays = (from, to) => {
  if (!from || !to) return 0;
  const days = (new Date(to) - new Date(from)) / 86400000 + 1;
  return days > 0 ? days : 0;
};

// Two inclusive date ranges overlap when each starts before the other ends.
const overlaps = (from, to, otherFrom, otherTo) =>
  from <= otherTo && otherFrom <= to;

export default function LeaveForm({
  show,
  onClose,
  onSubmit,
  initialData,
  leaves = [],
}) {
  const [formData, setFormData] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [session] = useSession();
  const { entityOptions, entityShortNames } = useEntities();
  // Both lists are entity-scoped, so they follow the session automatically.
  // The selected employee pre-fills the scope; it can be edited afterwards.
  // Badge carries the entity so options spanning several entities aren't ambiguous in the dropdown
  const employees = useEmployees().map((e) => ({
    ...e,
    badge: entityShortNames(e.entities),
  }));
  const leaveTypes = useLeaveTypes().map((t) => ({
    ...t,
    badge: entityShortNames(t.entities),
  }));
  // Entity scope is only meaningful to a superuser or an account spanning several entities
  const canAssignEntities =
    isSuperuser(session) || (session?.entities?.length || 0) > 1;

  useEffect(() => {
    setFormData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
    setError(null);
  }, [initialData, show]);

  if (!show) return null;

  const field = (name, value) => setFormData({ ...formData, [name]: value });
  const days = countDays(formData.hal_request_datefr, formData.hal_request_dateto);

  // Selecting an employee pulls its scope into the form so the picker starts pre-filled
  const changeEmployee = (nip) => {
    const chosen = employees.find((e) => e.value === nip);
    setFormData({
      ...formData,
      hal_empy_nip: nip,
      entities: chosen?.entities?.length ? chosen.entities : formData.entities,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // The date inputs cannot express "to >= from" on their own
    if (days === 0) return setError("Tanggal selesai harus setelah tanggal mulai");
    const mine = new Set((formData.entities || []).map(String));
    const sharesEntity = (l) =>
      (l.entities || []).map(String).some((id) => mine.has(id));
    // Exact duplicate: same entity, same employee, same date range
    const duplicate = leaves.some(
      (l) =>
        l.hal_leave_id !== initialData?.hal_leave_id &&
        l.hal_empy_nip === formData.hal_empy_nip &&
        sharesEntity(l) &&
        l.hal_request_datefr === formData.hal_request_datefr &&
        l.hal_request_dateto === formData.hal_request_dateto,
    );
    if (duplicate)
      return setError(
        "Pengajuan cuti dengan karyawan, entity, dan rentang tanggal yang sama sudah ada.",
      );
    // Block overlapping active leave requests for the same employee.
    // Declined requests don't block; only Open / Verified / Approved do.
    const ACTIVE = new Set(["Open", "Verified", "Approved"]);
    const clash = leaves.some(
      (l) =>
        l.hal_leave_id !== initialData?.hal_leave_id &&
        l.hal_empy_nip === formData.hal_empy_nip &&
        ACTIVE.has(l.hal_request_sts) &&
        sharesEntity(l) &&
        overlaps(
          formData.hal_request_datefr,
          formData.hal_request_dateto,
          l.hal_request_datefr,
          l.hal_request_dateto
        )
    );
    if (clash)
      return setError(
        "Karyawan ini sudah memiliki pengajuan cuti aktif pada rentang tanggal tersebut."
      );
    onSubmit({ ...formData, hal_request_days: days });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Pengajuan Cuti" : "Tambah Pengajuan Cuti"}
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
            {canAssignEntities && (
              <div>
                <span className={labelClass}>Entity</span>
                <MultiSelect
                  id="leave-entities"
                  options={entityOptions}
                  value={formData.entities || []}
                  onChange={(value) => field("entities", value)}
                  placeholder="Pilih Entity"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="hal_empy_nip" className={labelClass}>
                  Karyawan
                </label>
                <Dropdown
                  id="hal_empy_nip"
                  options={employees}
                  value={formData.hal_empy_nip}
                  onChange={changeEmployee}
                  placeholder="Pilih Karyawan"
                  required
                />
              </div>

              <div>
                <label htmlFor="hal_abs_type" className={labelClass}>
                  Jenis Cuti
                </label>
                <Dropdown
                  id="hal_abs_type"
                  options={leaveTypes}
                  value={formData.hal_abs_type}
                  onChange={(value) => field("hal_abs_type", value)}
                  placeholder="Pilih Jenis Cuti"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="hal_request_datefr" className={labelClass}>
                  Tanggal Mulai
                </label>
                <input autoComplete="off"
                  id="hal_request_datefr"
                  type="date"
                  value={formData.hal_request_datefr}
                  onChange={(e) => field("hal_request_datefr", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="hal_request_dateto" className={labelClass}>
                  Tanggal Selesai
                </label>
                <input autoComplete="off"
                  id="hal_request_dateto"
                  type="date"
                  value={formData.hal_request_dateto}
                  onChange={(e) => field("hal_request_dateto", e.target.value)}
                  min={formData.hal_request_datefr || undefined}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className={labelClass}>Jumlah Hari</span>
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {days} hari
                </p>
              </div>

              <div>
                <label htmlFor="hal_request_sts" className={labelClass}>
                  Status
                </label>
                <Dropdown
                  id="hal_request_sts"
                  options={LEAVE_STATUSES}
                  value={formData.hal_request_sts}
                  onChange={(value) => field("hal_request_sts", value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="hal_request_desc" className={labelClass}>
                Keterangan
              </label>
              <textarea autoComplete="off"
                id="hal_request_desc"
                value={formData.hal_request_desc}
                onChange={(e) => field("hal_request_desc", e.target.value)}
                placeholder="Masukkan Keterangan"
                rows={3}
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
