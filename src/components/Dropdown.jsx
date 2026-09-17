import { useEffect, useRef } from "react";

const Badge = ({ children }) => (
  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
    {children}
  </span>
);

// Single-select built on native <details>, matching MultiSelect's look/behavior.
// options: [{ value, label, badge? }]. `badge` (e.g. an entity short name) renders
// as a pill to the right of label. `required` is enforced via a visually-hidden
// native <select> mirroring the value, so native form validation still fires.
export default function Dropdown({
  id,
  options,
  value = "",
  onChange,
  placeholder = "Pilih...",
  required = false,
  disabled = false,
  className = "",
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (disabled) return;
    const closeIfOutside = (e) => {
      if (ref.current?.open && !ref.current.contains(e.target)) {
        ref.current.open = false;
      }
    };
    document.addEventListener("mousedown", closeIfOutside);
    return () => document.removeEventListener("mousedown", closeIfOutside);
  }, [disabled]);

  const selected = options.find((o) => o.value === value);
  const choose = (optionValue) => {
    onChange(optionValue);
    if (ref.current) ref.current.open = false;
  };

  return (
    <details
      ref={ref}
      id={id}
      className={`group relative ${disabled ? "pointer-events-none" : ""}`}
    >
      <summary
        className={`flex list-none items-center justify-between rounded-lg border px-3 py-2 text-sm ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
            : "cursor-pointer border-slate-300 text-slate-700"
        } ${className}`}
      >
        <span className={`flex min-w-0 items-center gap-2 ${selected ? "" : "text-slate-400"}`}>
          <span className="truncate">{selected?.label || placeholder}</span>
          {selected?.badge && <Badge>{selected.badge}</Badge>}
        </span>
        {!disabled && (
          <span className="ml-2 shrink-0 text-xs text-slate-400 group-open:rotate-180">
            ▾
          </span>
        )}
      </summary>
      {!disabled && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {options.length === 0 && (
            <p className="px-2 py-1 text-sm text-slate-400">
              Tidak ada pilihan
            </p>
          )}
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => choose(option.value)}
              className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-sm hover:bg-slate-50 ${
                option.value === value ? "bg-cyan-50 text-cyan-700" : ""
              }`}
            >
              <span className="truncate">{option.label}</span>
              {option.badge && <Badge>{option.badge}</Badge>}
            </button>
          ))}
        </div>
      )}
      {required && (
        // Invisible native select: same value, so the browser's own required
        // validation still blocks submit when nothing is chosen.
        <select
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          required
          onChange={() => {}}
          className="absolute inset-x-0 bottom-0 h-0 w-full border-0 p-0 opacity-0"
        >
          <option value="" />
          {value && <option value={value}>{value}</option>}
        </select>
      )}
    </details>
  );
}
