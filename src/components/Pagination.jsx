import { Icon } from "@iconify/react";

// Page number strip: at most `window` buttons, current centered where possible.
function pageNumbers(currentPage, totalPages, window = 5) {
  if (totalPages <= window)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const half = Math.floor(window / 2);
  const start = Math.min(Math.max(currentPage - half, 1), totalPages - window + 1);
  return Array.from({ length: window }, (_, i) => start + i);
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  showItemsInfo = true,
  alwaysShow = false,
}) {
  if (totalItems === 0) return null;
  if (!alwaysShow && totalPages <= 1) return null;

  const startItem = Math.min((currentPage - 1) * perPage + 1, totalItems);
  const endItem = Math.min(currentPage * perPage, totalItems);
  const go = (p) => p >= 1 && p <= totalPages && p !== currentPage && onPageChange(p);

  const btn =
    "flex h-9 min-w-9 items-center justify-center border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-5 flex flex-col items-center gap-2">
      {showItemsInfo && (
        <div className="text-sm text-gray-500">
          Menampilkan {startItem} - {endItem} dari {totalItems} data
        </div>
      )}

      <nav aria-label="Navigasi halaman" className="flex">
        <button
          type="button"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman sebelumnya"
          className={`${btn} rounded-l-lg`}
        >
          <Icon icon="fa6-solid:chevron-left" className="h-3 w-3" />
        </button>

        {pageNumbers(currentPage, Math.max(totalPages, 1)).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`${btn} -ml-px ${
              p === currentPage
                ? "bg-primary text-white hover:bg-primary"
                : "bg-white"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Halaman berikutnya"
          className={`${btn} -ml-px rounded-r-lg`}
        >
          <Icon icon="fa6-solid:chevron-right" className="h-3 w-3" />
        </button>
      </nav>
    </div>
  );
}
