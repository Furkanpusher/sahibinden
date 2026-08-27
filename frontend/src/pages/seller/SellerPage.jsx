import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Layers,
  Users,
  UserPlus,
  UserCheck,
  Loader2,
  Car,
  Home as HomeIcon,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import UserMenu from "../../components/UserMenu";
import Pagination from "../../components/Pagination";
import { getSellerProfile, toggleFollowSeller, formatApiError, getListingCoverImage, formatImgUrl } from "../../api";

export default function SellerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "car" | "house"

  const currentUserId = localStorage.getItem("user_id");
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
  const isOwnProfile = currentUserId && String(currentUserId) === String(id);

  // Satıcı profili ve ilanlarını çek
  const fetchSellerData = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSellerProfile(id, page);
      setSeller(data.seller);
      setIsFollowing(Boolean(data.seller?.is_following));
      setFollowerCount(data.seller?.follower_count || 0);

      const results = data.listings?.results || (Array.isArray(data.listings) ? data.listings : []);
      setListings(results);
      setTotalItems(data.listings?.count || results.length);
    } catch (err) {
      setError(err.message || "Satıcı bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData(currentPage);
  }, [id, currentPage]);

  // Takip et / Takipten çık
  const handleToggleFollow = async () => {
    if (!token) {
      toast.info("Satıcıyı takip etmek için lütfen giriş yapınız.");
      navigate("/login");
      return;
    }

    setIsTogglingFollow(true);
    try {
      const res = await toggleFollowSeller(id);
      setIsFollowing(res.is_following);
      setFollowerCount(res.follower_count);
      toast.success(res.detail || (res.is_following ? "Satıcı takip edildi." : "Takipten çıkıldı."));
    } catch (err) {
      if (err.isSessionExpired) return;
      toast.error(formatApiError(err) || "Takip işlemi gerçekleştirilemedi.");
    } finally {
      setIsTogglingFollow(false);
    }
  };

  // Sekme filtrelemesi
  const filteredListings = listings.filter((item) => {
    if (activeTab === "all") return true;
    return item.listing_type === activeTab;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-5 text-[#EDEFF2] sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl">
        {/* Üst Bar */}
        <header className="mb-6 flex items-center justify-between border-b border-[#232E3D] pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#232E3D] bg-[#161F2B] text-[#8B95A3] transition-colors hover:border-[#E8A33D]/50 hover:text-[#EDEFF2]"
              title="Geri Dön"
            >
              <ArrowLeft size={18} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#E8A33D]">SAHİBİNDEN</span>
            </Link>
          </div>
          <UserMenu />
        </header>

        {loading && !seller ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-[#8B95A3]">
              <Loader2 size={32} className="animate-spin text-[#E8A33D]" />
              <p className="text-sm font-medium">Satıcı profili yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-red-500/10 p-4 text-red-400">
              <User size={36} />
            </div>
            <h2 className="text-lg font-semibold text-[#EDEFF2]">{error}</h2>
            <Link
              to="/"
              className="rounded-xl bg-[#E8A33D] px-5 py-2.5 text-sm font-semibold text-[#0F1720] hover:bg-[#F0B058] transition-colors"
            >
              Anasayfaya Dön
            </Link>
          </div>
        ) : (
          <>
            {/* 👤 SATICI PROFİL KARTI */}
            <div className="mb-8 rounded-2xl border border-[#232E3D] bg-[#161F2B] p-6 shadow-xl relative overflow-hidden">
              {/* Arka plan parlama efekti */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-[#E8A33D]/5 blur-3xl pointer-events-none" />

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* Sol: Avatar ve Temel Bilgiler */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    {seller?.profile_picture ? (
                      <img
                        src={formatImgUrl(seller.profile_picture)}
                        alt={seller.username}
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-[#E8A33D]/40 shadow-lg"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#232E3D] text-2xl font-bold text-[#E8A33D] border-2 border-[#344458] shadow-lg">
                        {seller?.username?.[0]?.toUpperCase() || <User size={32} />}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#E8A33D] text-[#0F1720] shadow-sm">
                      <Sparkles size={13} />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl font-bold text-[#EDEFF2]">
                        {seller?.first_name || seller?.last_name
                          ? `${seller?.first_name || ""} ${seller?.last_name || ""}`.trim()
                          : seller?.username}
                      </h1>
                      <span className="rounded-full bg-[#E8A33D]/10 px-2.5 py-0.5 text-xs font-semibold text-[#E8A33D] border border-[#E8A33D]/20">
                        Satıcı
                      </span>
                    </div>

                    <p className="text-sm text-[#8B95A3] mt-0.5">@{seller?.username}</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-[#8B95A3]">
                      {seller?.date_joined && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-[#E8A33D]" />
                          Üyelik: {formatDate(seller.date_joined)}
                        </span>
                      )}

                      {seller?.phone_number && (
                        <a
                          href={`tel:${seller.phone_number}`}
                          className="flex items-center gap-1.5 text-[#E8A33D] hover:underline font-medium"
                        >
                          <Phone size={14} />
                          {seller.phone_number}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ: İstatistikler ve Takip Butonu */}
                <div className="flex flex-wrap items-center gap-4 border-t border-[#232E3D] pt-4 md:border-t-0 md:pt-0">
                  {/* İstatistik Kutuları */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-[#232E3D] bg-[#0F1720]/70 px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[#8B95A3]">
                        <Layers size={14} className="text-[#3B82F6]" />
                        <span>İlanlar</span>
                      </div>
                      <p className="mt-1 text-lg font-bold text-[#EDEFF2]">
                        {seller?.total_listings_count ?? totalItems}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#232E3D] bg-[#0F1720]/70 px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[#8B95A3]">
                        <Users size={14} className="text-[#10B981]" />
                        <span>Takipçi</span>
                      </div>
                      <p className="mt-1 text-lg font-bold text-[#EDEFF2]">
                        {followerCount}
                      </p>
                    </div>
                  </div>

                  {/* Takip Et / Takipten Çık Butonu (Kendi profilinde gösterme) */}
                  {!isOwnProfile && (
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      disabled={isTogglingFollow}
                      className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                        isFollowing
                          ? "border border-[#232E3D] bg-[#161F2B] text-[#EDEFF2] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                          : "bg-[#E8A33D] text-[#0F1720] hover:bg-[#F0B058]"
                      }`}
                    >
                      {isTogglingFollow ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>İşleniyor...</span>
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserCheck size={16} className="text-emerald-400" />
                          <span>Takip Ediliyor</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          <span>Takip Et</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 🏷️ İLANLAR BAŞLIĞI VE KATEGORİ SEKMELERİ */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#EDEFF2]">Satıcının Yayındaki İlanları</h2>
                <p className="text-xs text-[#8B95A3] mt-0.5">Toplam {filteredListings.length} ilan gösteriliyor</p>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-[#232E3D] bg-[#161F2B] p-1 self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "all"
                      ? "bg-[#E8A33D] text-[#0F1720] shadow-sm"
                      : "text-[#8B95A3] hover:text-[#EDEFF2]"
                  }`}
                >
                  Tümü ({listings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("car")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "car"
                      ? "bg-[#E8A33D] text-[#0F1720] shadow-sm"
                      : "text-[#8B95A3] hover:text-[#EDEFF2]"
                  }`}
                >
                  <Car size={14} />
                  <span>Vasıta ({listings.filter((i) => i.listing_type === "car").length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("house")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "house"
                      ? "bg-[#E8A33D] text-[#0F1720] shadow-sm"
                      : "text-[#8B95A3] hover:text-[#EDEFF2]"
                  }`}
                >
                  <HomeIcon size={14} />
                  <span>Emlak ({listings.filter((i) => i.listing_type === "house").length})</span>
                </button>
              </div>
            </div>

            {/* 🚘 İLAN LİSTESİ GRID */}
            {filteredListings.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#232E3D] bg-[#161F2B]/40 text-center p-8">
                <div className="rounded-full bg-[#232E3D] p-3.5 text-[#8B95A3] mb-3">
                  <Layers size={28} />
                </div>
                <h3 className="text-base font-semibold text-[#EDEFF2]">İlan Bulunamadı</h3>
                <p className="text-xs text-[#8B95A3] mt-1 max-w-sm">
                  {activeTab !== "all"
                    ? "Bu kategoride henüz yayınlanmış bir ilan bulunmuyor."
                    : "Bu satıcıya ait aktif bir ilan bulunmamaktadır."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredListings.map((item) => {
                  const isCar = item.listing_type === "car";
                  const detailUrl = isCar ? `/cars/${item.id}` : `/houses/${item.id}`;
                  const displayImg = getListingCoverImage(item, isCar ? "car" : "house");

                  return (
                    <Link
                      key={item.id}
                      to={detailUrl}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[#232E3D] bg-[#161F2B] transition-all duration-200 hover:-translate-y-1 hover:border-[#E8A33D]/60 hover:shadow-xl hover:shadow-black/40"
                    >
                      {/* Resim & Kategori Etiketi */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0F1720]">
                        <img
                          src={displayImg}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-lg bg-[#0F1720]/80 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold text-[#EDEFF2] border border-[#232E3D]">
                          {isCar ? <Car size={12} className="text-[#3B82F6]" /> : <HomeIcon size={12} className="text-[#10B981]" />}
                          <span>{isCar ? "Vasıta" : "Emlak"}</span>
                        </span>
                      </div>

                      {/* Bilgiler */}
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-lg font-bold text-[#E8A33D]">
                          {item.price ? `${Number(item.price).toLocaleString("tr-TR")} TL` : "Fiyat Belirtilmemiş"}
                        </p>

                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-[#EDEFF2] group-hover:text-[#E8A33D] transition-colors">
                          {item.title}
                        </h3>

                        <div className="mt-auto pt-3 border-t border-[#232E3D] flex items-center justify-between text-xs text-[#8B95A3]">
                          <span className="flex items-center gap-1 truncate max-w-[140px]">
                            <MapPin size={12} className="text-[#E8A33D] shrink-0" />
                            <span className="truncate">{item.city || "Şehir Belirtilmedi"}</span>
                          </span>

                          <span className="flex items-center gap-1 shrink-0">
                            <Clock size={12} />
                            <span>{item.listing_date || "Yeni"}</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Sayfalama (Pagination) */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={24}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
    </div>
  );
}
