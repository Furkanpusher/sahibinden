import { Link, useLocation } from "react-router-dom";
import { X, Scale, Trash2, ArrowRight } from "lucide-react";
import { useCompare } from "../context/CompareContext";

export default function CompareBar() {
  const { compareItems, compareType, removeFromCompare, clearCompare, maxLimit } =
    useCompare();
  const location = useLocation();

  // Karşılaştırma sayfasındaysak alt barı göstermeyebiliriz
  if (compareItems.length === 0 || location.pathname === "/karsilastir") {
    return null;
  }

  const canCompare = compareItems.length >= 2;
  const compareUrl = `/karsilastir?type=${compareType}&ids=${compareItems
    .map((item) => item.id)
    .join(",")}`;

  // 4 slotu tamamlamak için boş slot dizisi
  const emptySlotsCount = Math.max(0, maxLimit - compareItems.length);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#232E3D] bg-[#161F2B]/95 px-4 py-3 shadow-2xl backdrop-blur-lg transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Sol Alan: Başlık ve Kategori */}
        <div className="hidden md:flex items-center gap-2.5 min-w-[130px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8A33D]/10 text-[#E8A33D]">
            <Scale size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-[#EDEFF2]">Karşılaştırma</div>
            <div className="text-[11px] text-[#8B95A3]">
              {compareType === "car" ? "Araç" : "Konut"} ({compareItems.length}/{maxLimit})
            </div>
          </div>
        </div>

        {/* Orta Alan: Seçilen İlan Kartları & Boş Slotlar */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {compareItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex min-w-[150px] max-w-[200px] sm:min-w-[170px] items-center gap-2 rounded-lg border border-[#2B3747] bg-[#0F1720] p-1.5 transition-all hover:border-[#4A5568]"
            >
              {/* Görsel */}
              <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded bg-[#161F2B]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-[#667384]">
                    No img
                  </div>
                )}
              </div>

              {/* Bilgi */}
              <div className="min-w-0 flex-1 pr-4">
                <p className="truncate text-[11px] font-medium text-[#EDEFF2]" title={item.title}>
                  {item.title}
                </p>
                {item.price && (
                  <p className="text-[11px] font-bold text-[#E8A33D]">
                    {typeof item.price === "number"
                      ? `${new Intl.NumberFormat("tr-TR").format(item.price)} TL`
                      : item.price}
                  </p>
                )}
              </div>

              {/* Silme Butonu */}
              <button
                type="button"
                onClick={() => removeFromCompare(item.id)}
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#232E3D] text-[#8B95A3] opacity-80 hover:bg-[#E88080]/20 hover:text-[#E88080] hover:opacity-100 transition-colors"
                title="Listeden Kaldır"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          {/* Boş Slotlar (Görsel Denge İçin) */}
          {Array.from({ length: emptySlotsCount }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="hidden lg:flex h-[52px] min-w-[140px] items-center justify-center rounded-lg border border-dashed border-[#232E3D]/80 bg-[#0F1720]/40 text-center text-[11px] text-[#4A5568]"
            >
              + İlan Seç
            </div>
          ))}
        </div>

        {/* Sağ Alan: Butonlar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearCompare}
            className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-[#8B95A3] transition-colors hover:bg-[#232E3D]/60 hover:text-[#EDEFF2]"
            title="Seçilenleri Temizle"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Temizle</span>
          </button>

          {canCompare ? (
            <Link
              to={compareUrl}
              className="flex items-center gap-1.5 rounded-lg bg-[#E8A33D] px-4 py-2 text-xs font-bold text-[#0F1720] shadow-md shadow-[#E8A33D]/20 transition-all hover:bg-[#F0B058] active:scale-95"
            >
              <span>Karşılaştır ({compareItems.length})</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg bg-[#232E3D] px-3.5 py-2 text-xs font-semibold text-[#667384]"
              title="Karşılaştırmak için en az 2 ilan seçmelisiniz"
            >
              En Az 2 İlan Seçin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
