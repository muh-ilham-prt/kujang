// Multi-select built on native <details> — open/close and keyboard nav come free.
// options: [{ value, label }], value: array of selected values.
export default function MultiSelect({
  id,
  options,
  value = [],
  onChange,
  placeholder = "Pilih...",
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

  return (
    <details id={id} className="group relative">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
        <span className={selectedLabels.length ? "" : "text-slate-400"}>
          {selectedLabels.join(", ") || placeholder}
        </span>
        <span className="ml-2 text-xs text-slate-400 group-open:rotate-180">▾</span>
      </summary>
      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        {options.length === 0 && (
          <p className="px-2 py-1 text-sm text-slate-400">Tidak ada pilihan</p>
        )}
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            {option.label}
          </label>
        ))}
      </div>
    </details>
  );
}
