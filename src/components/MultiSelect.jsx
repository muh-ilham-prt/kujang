import { useEffect, useRef } from "react";

const Badge = ({ children }) => (
  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
    {children}
  </span>
);

// Multi-select built on native <details> — open/close and keyboard nav come free.
// options: [{ value, label, badge? }], value: array of selected values.
// disabled: read-only display (no dropdown) — used when scope is derived from a role.
export default function MultiSelect({
  id,
  options,
  value = [],
  onChange,
  placeholder = "Pilih...",
  disabled = false,
}) {
  const toggle = (option) =>
    onChange(
      value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option]
    );

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

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
        }`}
      >
        <span className={selectedLabels.length ? "" : "text-slate-400"}>
          {selectedLabels.join(", ") || placeholder}
        </span>
        {!disabled && (
          <span className="ml-2 text-xs text-slate-400 group-open:rotate-180">▾</span>
        )}
      </summary>
      {!disabled && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {options.length === 0 && (
            <p className="px-2 py-1 text-sm text-slate-400">Tidak ada pilihan</p>
          )}
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"
            >
              <input autoComplete="off"
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">{option.label}</span>
                {option.badge && <Badge>{option.badge}</Badge>}
              </span>
            </label>
          ))}
        </div>
      )}
    </details>
  );
}
