import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  SlidersHorizontal,
  Loader2,
  SearchX,
  RotateCcw,
  Search,
  Scale,
} from "lucide-react";
import { fetchListings, getListingCoverImage } from "../../api";
import { FilterInput, FilterSelect } from "../../components/ListingUI";
import UserMenu from "../../components/UserMenu";
import Pagination from "../../components/Pagination";
import CreateSearchAlarmButton from "../../components/CreateSearchAlarmButton";
import { getCities, getDistricts } from "../../data/helper";
import { useCompare } from "../../context/CompareContext";

const ROOM_OPTIONS = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "Dupleks"];

// 📸 Fotoğraf URL Çözümleyici
const getHouseCoverImage = (house) => {
  return getListingCoverImage(house, "house");
};

export default function HouseListPage() {
  const navigate = useNavigate();
  const { toggleCompare, isInCompare } = useCompare();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // 📄 Sayfalama State'leri
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get("page_size")) || 24
  );
  const [totalCount, setTotalCount] = useState(0);

  // 1. Sayfa ilk açıldığında URL'deki parametreleri başlangıç değeri yapıyoruz
  const initialFilters = {
    number_of_rooms: searchParams.get("number_of_rooms") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    city: searchParams.get("city") || "",
    district: searchParams.get("district") || "",
  };

  // 🔹 TASLAK STATE: Kullanıcı formda seçim yaparken sadece bu güncellenir (istek gitmez)
  const [tempFilters, setTempFilters] = useState(initialFilters);

  // 🔹 UYGULANAN STATE: Sadece "Filtrele" butonuna basılınca güncellenir (istek tetikler)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // 🔹 Dropdown Seçenekleri (Helper'dan dinamik daralan veriler)
  const cities = useMemo(() => getCities(), []);
  const districts = useMemo(() => getDistricts(tempFilters.city), [tempFilters.city]);

  // 1. API İsteği: Filtre, sayfa numarası veya sayfa başı adet değiştiğinde çalışır
  useEffect(() => {
    setLoading(true);
    setError(null);

    const queryParams = {
      ...appliedFilters,
      page: currentPage,
      page_size: itemsPerPage,
    };

    fetchListings("/houses/", queryParams)
      .then((data) => {
        setHouses(data.results || []);
        setTotalCount(data.count || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [appliedFilters, currentPage, itemsPerPage]);

  // Input ve Select değiştikçe SADECE taslak state'i (tempFilters) güncelliyoruz
  const handleChange = (field) => (e) => {
    const newValue = e.target.value;
    setTempFilters((prev) => ({
      ...prev,
      [field]: newValue,
      ...(field === "city" ? { district: "" } : {}), // Şehir değişirse seçili ilçeyi sıfırla
    }));
  };

  // 🔹 "FİLTRELE" BUTONUNA BASILINCA ÇALIŞIR
  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();

    setCurrentPage(1); // Filtre değişince 1. sayfaya sıfırla

    const cleanParams = Object.fromEntries(
      Object.entries({ ...tempFilters, page: 1, page_size: itemsPerPage }).filter(([_, v]) => v !== "")
    );
    setSearchParams(cleanParams);
    setAppliedFilters(tempFilters);
  };

  // 🔹 "TEMİZLE" BUTONUNA BASILINCA ÇALIŞIR
  const handleResetFilters = () => {
    const emptyFilters = {
      number_of_rooms: "",
      price_min: "",
      price_max: "",
      city: "",
      district: "",
    };
    setCurrentPage(1);
    setTempFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchParams({});
    setCurrentPage(1);
    setTempFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchParams({});
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val);
    setCurrentPage(1);
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: 1, page_size: val });
  };

  const formatTitle = (title) => {
    if (!title) return "";
    return title.length > 120 ? `${title.substring(0, 120)}...` : title;
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") return "-";
    return `${new Intl.NumberFormat("tr-TR").format(price)} TL`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-5 text-[#EDEFF2] sm:px-6 lg:px-8 lg:py-7">
      <div className="w-full">
        {/* Page Header */}
        <header className="mb-7 border-b border-[#232E3D] pb-5">
          <div className="flex items-center justify-between mb-5">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 text-sm font-medium text-[#8B95A3] transition-colors hover:text-[#EDEFF2]"
            >
              <ArrowLeft
                size={16}
                className="transition-transform duration-200 group-hover:-translate-x-1"
              />
              Ana sayfa
            </Link>

            <UserMenu />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#EDEFF2] sm:text-3xl">
                Ev İlanları
              </h1>

              <p className="mt-1 text-sm text-[#667384]">
                Aradığın evi filtreleyerek hızlıca bul.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CreateSearchAlarmButton
                category="house"
                appliedFilters={appliedFilters}
              />

              <Link
                to="/ev-ilan-olustur"
                className="rounded-lg bg-[#E8A33D] px-4 py-2 text-sm font-semibold text-[#0F1720] hover:bg-[#F0B058] transition-colors"
              >
                + İlan Oluştur
              </Link>

              {!loading && totalCount > 0 && (
                <span className="w-fit rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-1.5 text-xs font-medium text-[#8B95A3]">
                  {totalCount} sonuç
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Filter Sidebar */}
          <aside className="w-full shrink-0 lg:w-64 xl:w-72">
            <form
              onSubmit={handleApplyFilters}
              className="rounded-xl border border-[#232E3D] bg-[#161F2B] p-5 lg:sticky lg:top-6"
            >
              <div className="mb-5 flex items-center justify-between border-b border-[#232E3D] pb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#EDEFF2]">
                  <SlidersHorizontal size={16} />
                  Filtrele
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-[#8B95A3] hover:text-[#E8A33D] transition-colors"
                  title="Filtreleri Sıfırla"
                >
                  <RotateCcw size={12} />
                  Temizle
                </button>
              </div>

              <div className="flex flex-col space-y-4">
                <FilterSelect
                  label="Oda Sayısı"
                  value={tempFilters.number_of_rooms}
                  onChange={handleChange("number_of_rooms")}
                >
                  <option value="">Tüm Oda Sayıları</option>
                  {ROOM_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Şehir"
                  value={tempFilters.city}
                  onChange={handleChange("city")}
                >
                  <option value="">Tüm Şehirler</option>
                  {cities.map((c) => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Semt / İlçe"
                  value={tempFilters.district}
                  onChange={handleChange("district")}
                  disabled={!tempFilters.city}
                >
                  <option value="">{tempFilters.city ? "Tüm İlçeler" : "Önce Şehir Seçin"}</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </FilterSelect>

                <FilterInput
                  label="Min. Fiyat"
                  type="number"
                  placeholder="0"
                  value={tempFilters.price_min}
                  onChange={handleChange("price_min")}
                />

                <FilterInput
                  label="Max. Fiyat"
                  type="number"
                  placeholder="1.000.000"
                  value={tempFilters.price_max}
                  onChange={handleChange("price_max")}
                />

                <button
                  type="submit"
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-[#E8A33D] py-2.5 text-sm font-semibold text-[#0F1720] hover:bg-[#F0B058] active:scale-98 transition-all shadow-md shadow-[#E8A33D]/10"
                >
                  <Search size={15} />
                  Filtreleri Uygula
                </button>
              </div>
            </form>
          </aside>

          {/* Listings */}
          <main className="min-w-0 flex-1">
            {loading && (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-[#8B95A3]">
                <Loader2 size={32} className="mb-3 animate-spin text-[#E8A33D]" />
                <p className="text-sm font-medium">İlanlar aranıyor...</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-[#E88080]/30 bg-[#E88080]/10 p-5 text-center text-[#E88080]">
                <p className="text-sm font-medium">Hata: {error}</p>
              </div>
            )}

            {!loading && !error && houses.length === 0 && (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[#2B3747] bg-[#161F2B]/40 p-10 text-center">
                <SearchX size={42} className="mb-4 text-[#667384]" />
                <h3 className="text-lg font-semibold text-[#EDEFF2]">İlan Bulunamadı</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#8B95A3]">
                  Filtrelerinize uygun ev bulunamadı. Filtreleri değiştirerek tekrar deneyebilirsiniz.
                </p>
              </div>
            )}

            {/* Sahibinden Style House Table */}
            {!loading && !error && houses.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-xl border border-[#232E3D] bg-[#161F2B]/70 shadow-lg">
                  <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#232E3D] bg-[#1a2533] text-xs uppercase tracking-wider text-[#8B95A3]">
                        <th className="py-3.5 px-3 w-[45px] font-semibold text-center" title="Karşılaştır">
                          <Scale size={14} className="mx-auto text-[#8B95A3]" />
                        </th>
                        <th className="py-3.5 px-4 w-[160px] font-semibold text-center">Görsel</th>
                        <th className="py-3.5 px-4 font-semibold">İlan Başlığı</th>
                        <th className="py-3.5 px-3 w-[100px] font-semibold text-center">m²</th>
                        <th className="py-3.5 px-3 w-[120px] font-semibold text-center">Oda Sayısı</th>
                        <th className="py-3.5 px-4 w-[160px] font-semibold text-right">Fiyat</th>
                        <th className="py-3.5 px-4 w-[140px] font-semibold text-center">İlan Tarihi</th>
                        <th className="py-3.5 px-4 w-[140px] font-semibold text-center">İl / İlçe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232E3D]/60 text-[#EDEFF2]">
                      {houses.map((house) => {
                        const coverImg = getHouseCoverImage(house);
                        const locationText = [house.city, house.district].filter(Boolean);
                        const isSelected = isInCompare(house.id);

                        return (
                          <tr
                            key={house.id}
                            onClick={() => navigate(`/houses/${house.id}`)}
                            className={`group cursor-pointer transition-colors duration-150 ${isSelected
                              ? "bg-[#E8A33D]/10"
                              : "hover:bg-[#1c293a]/70"
                              }`}
                          >
                            {/* Karşılaştır Seçim Kutusu */}
                            <td
                              className="py-3.5 px-3 text-center align-middle"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompare(
                                  {
                                    id: house.id,
                                    title: house.title,
                                    image: coverImg,
                                    price: house.price,
                                  },
                                  "house"
                                );
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => { }}
                                className="h-4 w-4 rounded border-[#2B3747] bg-[#0F1720] accent-[#E8A33D] cursor-pointer"
                                title="Karşılaştırmaya Ekle / Çıkar"
                              />
                            </td>

                            {/* Görsel */}
                            <td className="p-3 align-middle text-center">
                              <Link
                                to={`/houses/${house.id}`}
                                className="block relative aspect-[4/3] w-36 mx-auto overflow-hidden rounded-lg border border-[#232E3D] bg-[#0F1720] transition-transform duration-200 group-hover:scale-105"
                              >
                                <img
                                  src={coverImg}
                                  alt={house.title}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </Link>
                            </td>

                            {/* İlan Başlığı */}
                            <td className="py-3.5 px-4 align-middle">
                              <Link
                                to={`/houses/${house.id}`}
                                className="font-semibold text-sm sm:text-[15px] text-[#EDEFF2] transition-colors group-hover:text-[#E8A33D] line-clamp-2 leading-relaxed"
                                title={house.title}
                              >
                                {formatTitle(house.title)}
                              </Link>
                            </td>

                            {/* m² */}
                            <td className="py-3.5 px-3 align-middle text-center font-medium text-sm text-[#C8D1DC]">
                              {house.meter_squared ? `${house.meter_squared} m²` : "-"}
                            </td>

                            {/* Oda Sayısı */}
                            <td className="py-3.5 px-3 align-middle text-center text-sm font-medium text-[#C8D1DC]">
                              {house.number_of_rooms || "-"}
                            </td>

                            {/* Fiyat */}
                            <td className="py-3.5 px-4 align-middle text-right font-bold text-[#E8A33D] text-base sm:text-[17px] whitespace-nowrap">
                              {formatPrice(house.price)}
                            </td>

                            {/* İlan Tarihi */}
                            <td className="py-3.5 px-4 align-middle text-center text-xs sm:text-[13px] text-[#8B95A3] whitespace-nowrap">
                              {formatDate(house.listing_date)}
                            </td>

                            {/* İl / İlçe */}
                            <td className="py-3.5 px-4 align-middle text-center text-xs sm:text-[13px] text-[#8B95A3]">
                              {locationText.length > 0 ? (
                                <div className="flex flex-col items-center leading-snug">
                                  <span className="font-medium text-[#EDEFF2]">{locationText[0]}</span>
                                  {locationText[1] && (
                                    <span className="text-[#8B95A3]">{locationText[1]}</span>
                                  )}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalItems={totalCount}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
