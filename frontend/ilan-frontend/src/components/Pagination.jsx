import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 24,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [12, 24, 48, 96],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  if (totalItems <= 0) return null;

  const handlePageClick = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sayfa numaraları algoritması (örn. 1 ... 4 5 6 ... 20)
  const getPageNumbers = () => {
    const delta = 2; // Aktif sayfanın sağı ve solu kaç basamak gösterilecek
    const range = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("dots-prev");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("dots-next");
    }

    range.unshift(1);
    if (totalPages > 1 && !range.includes(totalPages)) {
      range.push(totalPages);
    }

    return range;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-[#232E3D] pt-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Sol taraf: Bilgilendirme ve Sayfa Başına Seçici */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B95A3]">
        <span>
          Toplam <span className="font-semibold text-[#EDEFF2]">{totalItems}</span> ilandan{" "}
          <span className="font-semibold text-[#EDEFF2]">{startItem}</span> -{" "}
          <span className="font-semibold text-[#EDEFF2]">{endItem}</span> arası gösteriliyor
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#232E3D]">
            <span>Sayfa başı:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              aria-label="Sayfa başına gösterilecek ilan sayısı"
              className="rounded-md border border-[#232E3D] bg-[#161F2B] px-2 py-1 text-xs text-[#EDEFF2] focus:border-[#E8A33D] focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Sağ taraf: Sayfa Butonları */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {/* İlk Sayfa */}
          <button
            type="button"
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            aria-label="İlk sayfa"
            title="İlk Sayfa"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#232E3D] bg-[#161F2B] text-[#8B95A3] transition-colors hover:border-[#E8A33D]/50 hover:text-[#EDEFF2] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#232E3D] disabled:hover:text-[#8B95A3]"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Önceki Sayfa */}
          <button
            type="button"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Önceki sayfa"
            title="Önceki Sayfa"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#232E3D] bg-[#161F2B] text-[#8B95A3] transition-colors hover:border-[#E8A33D]/50 hover:text-[#EDEFF2] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#232E3D] disabled:hover:text-[#8B95A3]"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Sayfa Numaraları */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageItem, index) => {
              if (pageItem === "dots-prev" || pageItem === "dots-next") {
                return (
                  <span
                    key={`dots-${index}`}
                    className="flex h-9 w-7 items-center justify-center text-xs text-[#667384]"
                  >
                    •••
                  </span>
                );
              }

              const isCurrent = pageItem === currentPage;
              return (
                <button
                  key={pageItem}
                  type="button"
                  onClick={() => handlePageClick(pageItem)}
                  aria-label={`Sayfa ${pageItem}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-[#E8A33D] text-[#0F1720] shadow-sm shadow-[#E8A33D]/20"
                      : "border border-[#232E3D] bg-[#161F2B] text-[#8B95A3] hover:border-[#E8A33D]/50 hover:text-[#EDEFF2]"
                  }`}
                >
                  {pageItem}
                </button>
              );
            })}
          </div>

          {/* Sonraki Sayfa */}
          <button
            type="button"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Sonraki sayfa"
            title="Sonraki Sayfa"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#232E3D] bg-[#161F2B] text-[#8B95A3] transition-colors hover:border-[#E8A33D]/50 hover:text-[#EDEFF2] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#232E3D] disabled:hover:text-[#8B95A3]"
          >
            <ChevronRight size={16} />
          </button>

          {/* Son Sayfa */}
          <button
            type="button"
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Son sayfa"
            title="Son Sayfa"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#232E3D] bg-[#161F2B] text-[#8B95A3] transition-colors hover:border-[#E8A33D]/50 hover:text-[#EDEFF2] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#232E3D] disabled:hover:text-[#8B95A3]"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
