import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Loader2,
  Car,
  Home as HomeIcon,
  MapPin,
  ExternalLink,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import UserMenu from "../../components/UserMenu";
import { getFollowedSellers, toggleFollowSeller, formatApiError, getListingCoverImage, formatImgUrl } from "../../api";

export default function UserFollowing() {
  const [followedSellers, setFollowedSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unfollowingId, setUnfollowingId] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    getFollowedSellers()
      .then((data) => {
        setFollowedSellers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (err.isSessionExpired) return;
        setError(err.message || "Takip edilen satıcılar yüklenemedi.");
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  // Takipten Çık
  const handleUnfollow = async (sellerId, sellerName) => {
    setUnfollowingId(sellerId);
    try {
      await toggleFollowSeller(sellerId);
      setFollowedSellers((prev) => prev.filter((s) => s.id !== sellerId));
      toast.success(`${sellerName} takipten çıkarıldı.`);
    } catch (err) {
      if (err.isSessionExpired) return;
      toast.error(formatApiError(err) || "Takipten çıkma işlemi başarısız.");
    } finally {
      setUnfollowingId(null);
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

        {/* Başlık */}
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#EDEFF2] flex items-center gap-2.5">
              <UserCheck size={26} className="text-[#E8A33D]" />
              Takip Ettiğim Satıcılar
            </h1>
            <p className="text-xs text-[#8B95A3] mt-1">
              Takip ettiğiniz satıcıların güncel ilanlarını ve profil detaylarını buradan yönetebilirsiniz.
            </p>
          </div>
          <span className="self-start rounded-full bg-[#161F2B] border border-[#232E3D] px-3.5 py-1 text-xs font-semibold text-[#E8A33D]">
            {followedSellers.length} Satıcı Takip Ediliyor
          </span>
        </div>

        {/* İçerik */}
        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-[#8B95A3]">
              <Loader2 size={32} className="animate-spin text-[#E8A33D]" />
              <p className="text-sm font-medium">Takip edilen satıcılar yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-[#232E3D] bg-[#161F2B] p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#E8A33D] px-4 py-2 text-xs font-semibold text-[#0F1720]"
            >
              Tekrar Dene
            </button>
          </div>
        ) : followedSellers.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#232E3D] bg-[#161F2B]/40 p-8 text-center">
            <div className="rounded-full bg-[#232E3D] p-4 text-[#8B95A3] mb-3">
              <Users size={32} />
            </div>
            <h3 className="text-base font-semibold text-[#EDEFF2]">Henüz kimseyi takip etmiyorsunuz</h3>
            <p className="text-xs text-[#8B95A3] mt-1 max-w-sm">
              Beğendiğiniz satıcıları takip ederek yeni ilanlarından anında haberdar olabilirsiniz.
            </p>
            <Link
              to="/cars"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#E8A33D] px-5 py-2.5 text-xs font-semibold text-[#0F1720] hover:bg-[#F0B058] transition-colors"
            >
              İlanları Keşfet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {followedSellers.map((seller) => {
              const displayName =
                seller.first_name || seller.last_name
                  ? `${seller.first_name || ""} ${seller.last_name || ""}`.trim()
                  : seller.username;

              const sellerListings = seller.listings || [];

              return (
                <div
                  key={seller.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#232E3D] bg-[#161F2B] p-5 shadow-lg transition-all hover:border-[#E8A33D]/40"
                >
                  {/* Satıcı Üst Bilgisi */}
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#232E3D]">
                    <div className="flex items-center gap-3.5">
                      {seller.profile_picture ? (
                        <img
                          src={formatImgUrl(seller.profile_picture)}
                          alt={seller.username}
                          className="h-12 w-12 rounded-xl object-cover border border-[#232E3D]"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#232E3D] text-lg font-bold text-[#E8A33D] border border-[#344458]">
                          {seller.username?.[0]?.toUpperCase()}
                        </div>
                      )}

                      <div>
                        <Link
                          to={`/sellers/${seller.id}`}
                          className="font-semibold text-[#EDEFF2] hover:text-[#E8A33D] transition-colors text-base flex items-center gap-1.5"
                        >
                          <span>{displayName}</span>
                          <ExternalLink size={14} className="text-[#8B95A3]" />
                        </Link>
                        <p className="text-xs text-[#8B95A3]">@{seller.username}</p>
                      </div>
                    </div>

                    {/* Takipten Çık Butonu */}
                    <button
                      type="button"
                      onClick={() => handleUnfollow(seller.id, displayName)}
                      disabled={unfollowingId === seller.id}
                      className="flex items-center gap-1.5 rounded-lg border border-[#232E3D] bg-[#0F1720] px-3 py-1.5 text-xs font-semibold text-[#8B95A3] hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      {unfollowingId === seller.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <UserX size={13} />
                      )}
                      <span>Takipten Çık</span>
                    </button>
                  </div>

                  {/* Satıcının Son İlanları Önizleme */}
                  <div className="my-4">
                    <div className="mb-2.5 flex items-center justify-between text-xs text-[#8B95A3]">
                      <span className="flex items-center gap-1.5">
                        <Layers size={13} className="text-[#3B82F6]" />
                        Yayındaki İlanları ({seller.total_listings_count ?? sellerListings.length})
                      </span>
                      <Link
                        to={`/sellers/${seller.id}`}
                        className="text-[#E8A33D] hover:underline font-medium text-[11px]"
                      >
                        Tümünü Gör ({seller.total_listings_count ?? sellerListings.length}) →
                      </Link>
                    </div>

                    {sellerListings.length === 0 ? (
                      <p className="text-xs text-[#8B95A3] italic py-2">Henüz aktif ilanı bulunmuyor.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {sellerListings.slice(0, 2).map((item) => {
                          const isCar = item.listing_type === "car";
                          const detailUrl = isCar ? `/cars/${item.id}` : `/houses/${item.id}`;
                          const displayImg = getListingCoverImage(item, isCar ? "car" : "house");

                          return (
                            <Link
                              key={item.id}
                              to={detailUrl}
                              className="group flex flex-col rounded-xl border border-[#232E3D] bg-[#0F1720]/80 p-2 hover:border-[#E8A33D]/50 transition-all"
                            >
                              <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#161F2B] mb-2">
                                <img
                                  src={displayImg}
                                  alt={item.title}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              <p className="text-xs font-bold text-[#E8A33D] truncate">
                                {item.price ? `${Number(item.price).toLocaleString("tr-TR")} TL` : "Fiyat Yok"}
                              </p>
                              <p className="text-[11px] font-medium text-[#EDEFF2] line-clamp-1 group-hover:text-[#E8A33D] transition-colors">
                                {item.title}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Profil Butonu */}
                  <Link
                    to={`/sellers/${seller.id}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E8A33D]/10 hover:bg-[#E8A33D] text-[#E8A33D] hover:text-[#0F1720] border border-[#E8A33D]/30 py-2.5 text-xs font-semibold transition-all mt-auto"
                  >
                    <span>Satıcı Vitrinini Ziyaret Et</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
