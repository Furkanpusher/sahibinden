import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Heart, 
  Loader2, 
  SearchX, 
  Car, 
  Home as HomeIcon,
  Calendar,
  MapPin
} from "lucide-react";
import UserMenu from "../../components/UserMenu";
const carImages = [
  "/car-1.jpg", "/car-2.jpg", "/car-3.jpg", "/car-4.jpg", "/car-5.jpg",
  "/car-6.jpg", "/car-7.jpg", "/car-8.jpg", "/car-9.jpg", "/car-10.jpg",
];
const houseImages = [
  "/house-1.jpg", "/house-2.jpg", "/house-3.jpg", "/house-4.jpg", "/house-5.jpg",
  "/house-6.jpg", "/house-7.jpg", "/house-8.jpg", "/house-9.jpg", "/house-10.jpg",
];
export default function UserFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "car" | "house"
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
  useEffect(() => {
    // Giriş yapılmamışsa login sayfasına yönlendir
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    fetch("http://localhost:8001/api/listings/my-favorites/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Favoriler yüklenirken bir sorun oluştu.");
        return res.json();
      })
      .then((data) => {
        // İlanları ID'ye göre azalan (en yeniden eskiye) sıralayabiliriz
        const sorted = data.sort((a, b) => b.id - a.id);
        setFavorites(sorted);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, navigate]);
  // Sekmeye göre filtrele
  const filteredFavorites = favorites.filter((fav) => {
    if (activeTab === "all") return true;
    return fav.listing?.listing_type === activeTab;
  });
  const formatTitle = (title) => {
    if (!title) return "";
    return title.length > 90 ? `${title.substring(0, 90)}...` : title;
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
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/20">
                  <Heart size={20} className="fill-[#E8A33D]" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#EDEFF2] sm:text-3xl">
                  Favorilerim
                </h1>
              </div>
              <p className="mt-1 text-sm text-[#8B95A3]">
                Favoriye eklediğin tüm araç ve ev ilanları burada listelenir.
              </p>
            </div>
            {/* Kategori Sekmeleri (Tümü / Arabalar / Evler) */}
            {!loading && favorites.length > 0 && (
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
                  Tümü ({favorites.length})
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
                  Arabalar ({favorites.filter((f) => f.listing?.listing_type === "car").length})
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
                  Evler ({favorites.filter((f) => f.listing?.listing_type === "house").length})
                </button>
              </div>
            )}
          </div>
        </header>
        {/* İçerik Alanı */}
        <main>
          {/* Yükleniyor */}
          {loading && (
            <div className="flex min-h-[350px] flex-col items-center justify-center text-[#8B95A3]">
              <Loader2 size={36} className="mb-3 animate-spin text-[#E8A33D]" />
              <p className="text-sm font-medium">Favorileriniz getiriliyor...</p>
            </div>
          )}
          {/* Hata */}
          {error && (
            <div className="rounded-xl border border-[#E88080]/30 bg-[#E88080]/10 p-5 text-center text-[#E88080]">
              <p className="text-sm font-medium">Hata: {error}</p>
            </div>
          )}
          {/* Boş Liste */}
          {!loading && !error && filteredFavorites.length === 0 && (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#2B3747] bg-[#161F2B]/40 p-10 text-center">
              <SearchX size={44} className="mb-3 text-[#667384]" />
              <h3 className="text-lg font-semibold text-[#EDEFF2]">Favori İlan Bulunamadı</h3>
              <p className="mt-1 max-w-sm text-sm text-[#8B95A3]">
                {activeTab === "all"
                  ? "Henüz hiçbir ilanı favorilerinize eklemediniz."
                  : "Bu kategoride favoriye eklenmiş ilanınız bulunmuyor."}
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#E8A33D] px-4 py-2 text-xs font-semibold text-[#0F1720] hover:bg-[#F0B058] transition-colors"
              >
                İlanları Keşfet
              </Link>
            </div>
          )}
          {/* Favori İlan Kartları Grid */}
          {!loading && !error && filteredFavorites.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredFavorites.map((fav) => {
                const listing = fav.listing;
                if (!listing) return null;
                const isCar = listing.listing_type === "car";
                const detailUrl = isCar ? `/car/${listing.id}` : `/house/${listing.id}`;
                const defaultImg = isCar
                  ? carImages[listing.id % carImages.length]
                  : houseImages[listing.id % houseImages.length];
                return (
                  <Link
                    to={detailUrl}
                    key={fav.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-[#232E3D] bg-[#161F2B] p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-[#E8A33D]/50 hover:shadow-lg hover:shadow-black/20"
                  >
                    {/* Görsel ve Tip Etiketi */}
                    <div className="relative mb-2 aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#0F1720]">
                      <img
                        src={defaultImg}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Tip Rozeti (Araba / Ev) */}
                      <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-[#0F1720]/80 px-2 py-0.5 text-[10px] font-semibold text-[#EDEFF2] backdrop-blur-sm border border-[#232E3D]">
                        {isCar ? <Car size={11} className="text-[#E8A33D]" /> : <HomeIcon size={11} className="text-[#3B82F6]" />}
                        {isCar ? "Araç" : "Ev"}
                      </span>
                    </div>
                    {/* Fiyat */}
                    <div className="px-1 text-sm font-bold text-[#E8A33D]">
                      {formatPrice(listing.price)}
                    </div>
                    {/* Başlık */}
                    <h2
                      className="px-1 mt-1 text-xs font-medium leading-4 text-[#EDEFF2] line-clamp-2 transition-colors group-hover:text-[#E8A33D]"
                      title={listing.title}
                    >
                      {formatTitle(listing.title)}
                    </h2>
                    {/* Konum ve Eklenme Tarihi */}
                    <div className="mt-auto px-1 pt-2 text-[11px] text-[#667384] flex flex-col gap-0.5 border-t border-[#232E3D]/50">
                      {(listing.city || listing.district) && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin size={11} className="shrink-0 text-[#8B95A3]" />
                          <span>{[listing.city, listing.district].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
