import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  SlidersHorizontal,
  Loader2,
  SearchX,
  RotateCcw,
  Search,
} from "lucide-react";
import { fetchListings } from "../../api";
import { FilterInput, FilterSelect } from "../../components/ListingUI";
import UserMenu from "../../components/UserMenu";
import Pagination from "../../components/Pagination";

const defaultImages = [
  "/car-1.jpg", "/car-2.jpg", "/car-3.jpg", "/car-4.jpg", "/car-5.jpg",
  "/car-6.jpg", "/car-7.jpg", "/car-8.jpg", "/car-9.jpg", "/car-10.jpg",
];

const BACKEND_BASE = "http://127.0.0.1:8001";

// 📸 Fotoğraf URL Çözümleyici (Öncelik: Galeri/Kapak > Ana Resim > Default Havuzu)
const getCarCoverImage = (car) => {
  const coverFromGallery = car.images?.find((img) => img.is_cover)?.image || car.images?.[0]?.image;
  const rawUrl = coverFromGallery || car.image || car.imageUrl;

  if (rawUrl) {
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
    return `${BACKEND_BASE}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  }

  // Yüklenmiş görsel yoksa default listesinden seç
  return defaultImages[car.id % defaultImages.length];
};

export default function CarListPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // 📄 Sayfalama State'leri (Başlangıç değerini URL'den okuyabilir)
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get("page_size")) || 24
  );
  const [totalCount, setTotalCount] = useState(0);

  // 1. Sayfa ilk açıldığında URL'deki parametreleri başlangıç değeri yapıyoruz
  const initialFilters = {
    brand: searchParams.get("brand") || "",
    transmission_type: searchParams.get("transmission_type") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    city: searchParams.get("city") || "",
    district: searchParams.get("district") || "",
  };

  // 🔹 TASLAK STATE: Kullanıcı formda seçim yaparken sadece bu güncellenir (istek gitmez)
  const [tempFilters, setTempFilters] = useState(initialFilters);

  // 🔹 UYGULANAN STATE: Sadece "Filtrele" butonuna basılınca güncellenir (istek tetikler)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [options, setOptions] = useState({
    cities: [],
    districts: [],
    brands: [],
    transmissions: [],
  });

  // 1. API İsteği: Filtre, sayfa numarası veya sayfa başı adet değiştiğinde backend'e istek atar
  useEffect(() => {
    setLoading(true);
    setError(null);

    const queryParams = {
      ...appliedFilters,
      page: currentPage,
      page_size: itemsPerPage,
    };

    fetchListings("/all-cars/", queryParams)
      .then((data) => {
        // Backend pagination yapısına göre state'leri doldur
        setCars(data.results || []);
        setTotalCount(data.count || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [appliedFilters, currentPage, itemsPerPage]);

  // DINAMICALLY UPDATING THE NUMBERS OF FOUND OBJECTS IN FILTER DROPDOWN
  useEffect(() => {
    const params = {};
    if (tempFilters.city) params.city = tempFilters.city;
    if (tempFilters.brand) params.brand = tempFilters.brand;
    if (tempFilters.transmission_type) params.transmission_type = tempFilters.transmission_type;

    fetchListings("/car-options/", params)
      .then((data) => {
        setOptions({
          cities: data.cities || [],
          districts: data.districts || [],
          brands: data.brands || [],
          transmissions: data.transmissions || [],
        });
      })
      .catch((err) => console.error("Filtre seçenekleri alınamadı:", err));
  }, [tempFilters.city, tempFilters.brand, tempFilters.transmission_type]);

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
      brand: "",
      transmission_type: "",
      price_min: "",
      price_max: "",
      city: "",
      district: "",
    };
    setCurrentPage(1);
    setTempFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchParams({});
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // URL'deki sayfa parametresini de senkronize et
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
                Araç İlanları
              </h1>
              <p className="mt-1 text-sm text-[#667384]">
                Aradığın aracı filtreleyerek hızlıca bul.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/araba-ilan-olustur"
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
                {/* Marka Dropdown */}
                <FilterSelect
                  label="Marka"
                  value={tempFilters.brand}
                  onChange={handleChange("brand")}
                >
                  <option value="">Tüm Markalar</option>
                  {options.brands.map((b) => {
                    const val = typeof b === "object" ? b.name : b;
                    const countStr = typeof b === "object" && b.count ? ` (${b.count})` : "";
                    return <option key={val} value={val}>{val}{countStr}</option>;
                  })}
                </FilterSelect>

                {/* Şehir Dropdown */}
                <FilterSelect
                  label="Şehir"
                  value={tempFilters.city}
                  onChange={handleChange("city")}
                >
                  <option value="">Tüm Şehirler</option>
                  {options.cities.map((c) => {
                    const val = typeof c === "object" ? c.name : c;
                    const countStr = typeof c === "object" && c.count ? ` (${c.count})` : "";
                    return <option key={val} value={val}>{val}{countStr}</option>;
                  })}
                </FilterSelect>

                {/* Semt / İlçe Dropdown */}
                <FilterSelect
                  label="Semt / İlçe"
                  value={tempFilters.district}
                  onChange={handleChange("district")}
                  disabled={!tempFilters.city}
                >
                  <option value="">Tüm İlçeler</option>
                  {options.districts.map((d) => {
                    const val = typeof d === "object" ? d.name : d;
                    const countStr = typeof d === "object" && d.count ? ` (${d.count})` : "";
                    return <option key={val} value={val}>{val}{countStr}</option>;
                  })}
                </FilterSelect>

                {/* Vites Tipi Dropdown */}
                <FilterSelect
                  label="Vites Tipi"
                  value={tempFilters.transmission_type}
                  onChange={handleChange("transmission_type")}
                >
                  <option value="">Tüm Vites Tipleri</option>
                  {options.transmissions.map((t) => {
                    const val = typeof t === "object" ? t.name : t;
                    const countStr = typeof t === "object" && t.count ? ` (${t.count})` : "";
                    return <option key={val} value={val}>{val}{countStr}</option>;
                  })}
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
            {/* Loading */}
            {loading && (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-[#8B95A3]">
                <Loader2 size={32} className="mb-3 animate-spin text-[#E8A33D]" />
                <p className="text-sm font-medium">İlanlar aranıyor...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-[#E88080]/30 bg-[#E88080]/10 p-5 text-center text-[#E88080]">
                <p className="text-sm font-medium">Hata: {error}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && cars.length === 0 && (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[#2B3747] bg-[#161F2B]/40 p-10 text-center">
                <SearchX size={42} className="mb-4 text-[#667384]" />
                <h3 className="text-lg font-semibold text-[#EDEFF2]">İlan Bulunamadı</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#8B95A3]">
                  Filtrelerinize uygun araç bulunamadı. Filtreleri değiştirerek tekrar deneyebilirsiniz.
                </p>
              </div>
            )}

            {/* Car Grid */}
            {!loading && !error && cars.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                  {cars.map((car) => (
                    <Link to={`/car/${car.id}`} key={car.id} className="group min-w-0">
                      <div className="relative mb-2 aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#232E3D] bg-[#161F2B] transition-all duration-300 group-hover:border-[#4A5568] group-hover:shadow-lg group-hover:shadow-black/10">
                        {/* 📸 Çözümlenen Görsel */}
                        <img
                          src={getCarCoverImage(car)}
                          alt={car.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>

                      <h2
                        className="px-1 text-xs font-medium leading-5 text-[#8B95A3] transition-colors group-hover:text-[#E8A33D]"
                        title={car.title}
                      >
                        {formatTitle(car.title)}
                      </h2>
                      {(car.city || car.district) && (
                        <p className="px-1 mt-0.5 text-[11px] text-[#667384]">
                          {[car.city, car.district].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </Link>
                  ))}
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
