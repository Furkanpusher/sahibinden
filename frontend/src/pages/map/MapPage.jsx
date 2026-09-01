import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  Home as HomeIcon,
  Layers,
  Search,
  Loader2,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";
import ListingMap from "../../components/ListingMap";
import UserMenu from "../../components/UserMenu";
import { fetchListings, getListingCoverImage } from "../../api";

export default function MapPage() {
  const [selectedCategory, setSelectedCategory] = useState("car"); // "car" | "house"
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch listings based on category & city
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = {};
    if (selectedCity) params.city = selectedCity;
    if (searchQuery) params.q = searchQuery;
    params.page_size = 500; // the items that will be display on the map

    const fetchAll = async () => {
      try {
        let results = [];
        if (selectedCategory === "car") {
          const carData = await fetchListings("/search/cars/", params).catch(() => ({ results: [] }));
          results = (carData.results || []).map((c) => ({ ...c, listing_type: "car" }));
        } else if (selectedCategory === "house") {
          const houseData = await fetchListings("/search/houses/", params).catch(() => ({ results: [] }));
          results = (houseData.results || houseData || []).map((h) => ({ ...h, listing_type: "house" }));
        }

        if (isMounted) {
          setListings(results);
        }
      } catch (err) {
        console.error("Harita verileri yüklenirken hata:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedCity, searchQuery]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0F1720] text-[#EDEFF2] overflow-hidden">
      {/* 🧭 Top Navigation Bar */}
      <header className="h-16 px-4 border-b border-slate-800 bg-[#131D2A] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Ana Sayfa</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8A33D] font-bold text-[#0F1720]">
              İ
            </div>
            <span className="font-bold text-base tracking-tight text-white hidden md:inline">
              Haritada Keşfet
            </span>
          </div>
        </div>

        {/* 🎛️ Category Tabs */}
        <div className="flex items-center gap-1 bg-[#0F1720] p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCategory("car")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedCategory === "car"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
              }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Araçlar</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("house")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedCategory === "house"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
              }`}
          >
            <HomeIcon className="w-3.5 h-3.5" />
            <span>Evler</span>
          </button>
        </div>

        {/* Right Menu */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <UserMenu />
        </div>
      </header>

      {/* 🗺️ Main Workspace: Sidebar List + Leaflet Map */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* 📋 Sidebar Listings List */}
        <div
          className={`${sidebarOpen ? "w-full sm:w-80 md:w-96" : "w-0 hidden"
            } transition-all duration-300 bg-[#131D2A] border-r border-slate-800 flex flex-col z-10 shrink-0 h-full`}
        >
          {/* Sidebar Search Header */}
          <div className="p-3 border-b border-slate-800 flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İlan başlığı veya marka ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F1720] border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E8A33D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                {loading ? "Yükleniyor..." : `${listings.length} ilan listeleniyor`}
              </span>
              {selectedCity && (
                <span className="text-[#E8A33D] font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {selectedCity}
                </span>
              )}
            </div>
          </div>

          {/* Listings Cards Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#E8A33D]" />
                <span className="text-xs">İlanlar haritaya yükleniyor...</span>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Seçilen filtre veya şehirde ilan bulunamadı.
              </div>
            ) : (
              listings.map((item) => {
                const isHouse =
                  item.listing_type === "house" || item.meter_squared !== undefined;
                const coverImg = getListingCoverImage(item, isHouse ? "house" : "car");
                const detailUrl = isHouse ? `/houses/${item.id}` : `/cars/${item.id}`;
                const formattedPrice = item.price
                  ? new Intl.NumberFormat("tr-TR").format(item.price) + " ₺"
                  : "Fiyat Belirtilmedi";

                return (
                  <Link
                    key={`${item.listing_type || 'item'}-${item.id}`}
                    to={detailUrl}
                    className="flex gap-3 p-2.5 rounded-xl bg-[#0F1720] border border-slate-800 hover:border-slate-700 hover:bg-[#162232] transition group"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                      <img
                        src={coverImg}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        onError={(e) => {
                          e.currentTarget.src = "/car-1.jpg";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isHouse
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-blue-500/20 text-blue-400"
                              }`}
                          >
                            {isHouse ? "Ev" : "Araç"}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">
                            {item.city || "Şehir Yok"}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-[#E8A33D] transition">
                          {item.title}
                        </h4>
                      </div>
                      <div className="text-xs font-bold text-[#E8A33D]">
                        {formattedPrice}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* 🗺️ Leaflet Map Full View */}
        <div className="flex-1 h-full relative">
          <ListingMap
            listings={listings}
            selectedCity={selectedCity}
            onCitySelect={setSelectedCity}
            listingType={selectedCategory === "all" ? "car" : selectedCategory}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
