import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Layers, 
  Loader2, 
  SearchX, 
  Car, 
  Home as HomeIcon, 
  MapPin, 
  Edit3, 
  ArrowUpRight,
  Plus
} from "lucide-react";
import { fetchListings } from "../../api";
import UserMenu from "../../components/UserMenu";
const carImages = [
  "/car-1.jpg", "/car-2.jpg", "/car-3.jpg", "/car-4.jpg", "/car-5.jpg",
  "/car-6.jpg", "/car-7.jpg", "/car-8.jpg", "/car-9.jpg", "/car-10.jpg",
];
const houseImages = [
  "/house-1.jpg", "/house-2.jpg", "/house-3.jpg", "/house-4.jpg", "/house-5.jpg",
  "/house-6.jpg", "/house-7.jpg", "/house-8.jpg", "/house-9.jpg", "/house-10.jpg",
];
export default function UserListings() {
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "car" | "house"
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
  // Kullanıcı ID'sini bul
  let currentUserId = localStorage.getItem("user_id");
  if (!currentUserId) {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      if (userObj.id) currentUserId = String(userObj.id);
    } catch (e) {}
  }
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    // Hem arabaları hem evleri çekip kullanıcının olanları filtreliyoruz
    Promise.all([
      fetchListings("/all-cars/", { page_size: 50 }),
      fetchListings("/all-houses/", { page_size: 50 }),
    ])
      .then(([carsData, housesData]) => {
        const carList = Array.isArray(carsData) ? carsData : (carsData?.results || []);
        const houseList = Array.isArray(housesData) ? housesData : (housesData?.results || []);

        const userCars = carList
          .filter((c) => String(c.listing_owner) === String(currentUserId))
          .map((c) => ({ ...c, listing_type: "car" }));
        const userHouses = houseList
          .filter((h) => String(h.listing_owner) === String(currentUserId))
          .map((h) => ({ ...h, listing_type: "house" }));
        // İlanları ID'ye göre azalan (en son eklenen en başta) sıralıyoruz
        const combined = [...userCars, ...userHouses].sort((a, b) => b.id - a.id);
        setMyListings(combined);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, currentUserId, navigate]);
  const filteredListings = myListings.filter((item) => {
    if (activeTab === "all") return true;
    return item.listing_type === activeTab;
  });
  const formatTitle = (title) => {
    if (!title) return "";
    return title.length > 80 ? `${title.substring(0, 80)}...` : title;
  };
  const formatPrice = (price) => {
    if (!price) return "0 TL";
    return Number(price).toLocaleString("tr-TR") + " TL";
  };
  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-5 text-[#EDEFF2] sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl">
        
        {/* Üst Bar */}
        <header className="mb-8 border-b border-[#232E3D] pb-5">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Layers size={20} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#EDEFF2] sm:text-3xl">
                  İlanlarım
                </h1>
              </div>
              <p className="mt-1 text-sm text-[#8B95A3]">
                Yayınladığın tüm araç ve ev ilanlarını buradan yönetebilirsin.
              </p>
            </div>
            {/* Kategori Sekmeleri */}
            {!loading && myListings.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-[#232E3D] bg-[#161F2B] p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    activeTab === "all"
                      ? "bg-[#E8A33D] text-[#0F1720] font-semibold"
                      : "text-[#8B95A3] hover:text-[#EDEFF2]"
                  }`}
                >
                  Tümü ({myListings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("car")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                    activeTab === "car"
                      ? "bg-[#E8A33D] text-[#0F1720] font-semibold"
                      : "text-[#8B95A3] hover:text-[#EDEFF2]"
                  }`}
                >
                  <Car size={13} />
                  Arabalar ({myListings.filter((l) => l.listing_type === "car").length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("house")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                    activeTab === "house"
                      ? "bg-[#E8A33D] text-[#0F1720] font-semibold"
                      : "text-[#8B95A3] hover:text-[#EDEFF2]"
                  }`}
                >
                  <HomeIcon size={13} />
                  Evler ({myListings.filter((l) => l.listing_type === "house").length})
                </button>
              </div>
            )}
          </div>
        </header>
        {/* İçerik */}
        <main>
          {loading && (
            <div className="flex min-h-[350px] flex-col items-center justify-center text-[#8B95A3]">
              <Loader2 size={36} className="mb-3 animate-spin text-[#E8A33D]" />
              <p className="text-sm font-medium">İlanlarınız getiriliyor...</p>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-[#E88080]/30 bg-[#E88080]/10 p-5 text-center text-[#E88080]">
              <p className="text-sm font-medium">Hata: {error}</p>
            </div>
          )}
          {!loading && !error && filteredListings.length === 0 && (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#2B3747] bg-[#161F2B]/40 p-10 text-center">
              <SearchX size={44} className="mb-3 text-[#667384]" />
              <h3 className="text-lg font-semibold text-[#EDEFF2]">Henüz İlanınız Yok</h3>
              <p className="mt-1 max-w-sm text-sm text-[#8B95A3]">
                {activeTab === "all"
                  ? "Sistemde yayınlanmış herhangi bir ilanınız bulunmuyor."
                  : "Bu kategoride yayınlanmış bir ilanınız bulunmuyor."}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Link
                  to="/araba-ilan-olustur"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8A33D] px-3.5 py-2 text-xs font-semibold text-[#0F1720] hover:bg-[#F0B058] transition-colors"
                >
                  <Plus size={14} />
                  Araç İlanı Ekle
                </Link>
                <Link
                  to="/ev-ilan-olustur"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#232E3D] bg-[#1C2733] px-3.5 py-2 text-xs font-semibold text-[#EDEFF2] hover:bg-[#232E3D] transition-colors"
                >
                  <Plus size={14} />
                  Ev İlanı Ekle
                </Link>
              </div>
            </div>
          )}
          {/* İlan Kartları */}
          {!loading && !error && filteredListings.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredListings.map((item) => {
                const isCar = item.listing_type === "car";
                const detailUrl = isCar ? `/car/${item.id}` : `/house/${item.id}`;
                const updateUrl = isCar ? `/araba-ilan-guncelle/${item.id}` : `/ev-ilan-guncelle/${item.id}`;
                const defaultImg = isCar
                  ? item.imageUrl || carImages[item.id % carImages.length]
                  : item.imageUrl || houseImages[item.id % houseImages.length];
                return (
                  <div
                    key={`${item.listing_type}-${item.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-[#232E3D] bg-[#161F2B] p-2.5 transition-all duration-300 hover:border-[#4A5568] hover:shadow-lg hover:shadow-black/20"
                  >
                    {/* Görsel ve Tip Rozeti */}
                    <Link to={detailUrl} className="group/img relative mb-2 block aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#0F1720]">
                      <img
                        src={defaultImg}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      />
                      <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-[#0F1720]/80 px-2 py-0.5 text-[10px] font-semibold text-[#EDEFF2] backdrop-blur-sm border border-[#232E3D]">
                        {isCar ? <Car size={11} className="text-[#E8A33D]" /> : <HomeIcon size={11} className="text-[#3B82F6]" />}
                        {isCar ? "Araç" : "Ev"}
                      </span>
                    </Link>
                    {/* Fiyat */}
                    <Link to={detailUrl} className="block px-1 text-sm font-bold text-[#E8A33D] hover:underline">
                      {formatPrice(item.price)}
                    </Link>
                    {/* Başlık */}
                    <Link to={detailUrl} className="block">
                      <h2
                        className="px-1 mt-1 text-xs font-medium leading-4 text-[#EDEFF2] line-clamp-2 transition-colors hover:text-[#E8A33D]"
                        title={item.title}
                      >
                        {formatTitle(item.title)}
                      </h2>
                    </Link>
                    {/* Konum */}
                    {(item.city || item.district) && (
                      <div className="px-1 mt-1 flex items-center gap-1 text-[11px] text-[#667384] truncate">
                        <MapPin size={11} className="shrink-0 text-[#8B95A3]" />
                        <span>{[item.city, item.district].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    {/* Aksiyon Butonları (İlanı Gör / Düzenle) */}
                    <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-[#232E3D]/60 pt-2 text-xs">
                      <Link
                        to={detailUrl}
                        className="flex items-center justify-center gap-1 rounded-lg bg-[#0F1720] py-1.5 text-[11px] font-medium text-[#8B95A3] hover:bg-[#1C2733] hover:text-[#EDEFF2] transition-colors"
                      >
                        Gör
                        <ArrowUpRight size={12} />
                      </Link>
                      
                      <Link
                        to={updateUrl}
                        className="flex items-center justify-center gap-1 rounded-lg bg-[#E8A33D]/10 border border-[#E8A33D]/20 py-1.5 text-[11px] font-medium text-[#E8A33D] hover:bg-[#E8A33D] hover:text-[#0F1720] transition-colors"
                      >
                        <Edit3 size={11} />
                        Düzenle
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}