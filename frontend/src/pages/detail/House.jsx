import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Trash2, Pencil, Heart, Flag, X, Scale } from "lucide-react";
import { toast } from "sonner";
import { fetchListings, formatApiError, authFetch } from "../../api";
import { useCompare } from "../../context/CompareContext";

const defaultImages = [
  "/house-1.jpg", "/house-2.jpg", "/house-3.jpg", "/house-4.jpg", "/house-5.jpg",
  "/house-6.jpg", "/house-7.jpg", "/house-8.jpg", "/house-9.jpg", "/house-10.jpg",
];

const BACKEND_BASE = "http://127.0.0.1:8001";

// Resim URL'ini tam adrese çevirir (/media/.. -> http://127.0.0.1:8001/media/..)
const formatImgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function HouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toggleCompare, isInCompare } = useCompare();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 📸 Galeri Seçili Fotoğraf İndeksi
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 🔹 Favori State'leri
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  // 🔹 Şikayet (Report) State'leri
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const token = localStorage.getItem("access") || localStorage.getItem("token") || localStorage.getItem("access_token");
  const storedUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  const currentUserId = localStorage.getItem("user_id") || storedUser?.id || storedUser?.pk || localStorage.getItem("userId");
  const isStaff = localStorage.getItem("is_staff") === "true";

  const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8001/api";

  // 1. İlan Detayını ve Kullanıcının Favori Durumunu Çek
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchListings(`/houses/${id}/`)
      .then((data) => {
        setHouse(data);

        // Kullanıcı giriş yapmışsa bu ev favorilerinde var mı kontrol et
        if (token) {
          fetch(`${API_URL}/listings/favorites/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => (res.ok ? res.json() : []))
            .then((favList) => {
              if (Array.isArray(favList)) {
                const found = favList.some(
                  (fav) => String(fav.listing?.id) === String(id)
                );
                setIsFavorited(found);
              }
            })
            .catch((err) => console.error("Favori durumu alınamadı:", err));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token, API_URL]);

  const ownerId = house?.listing_owner?.id || house?.listing_owner?.pk || house?.listing_owner;

  const isOwner = Boolean(token) && 
                  Boolean(currentUserId) && 
                  Boolean(ownerId) && 
                  String(currentUserId) === String(ownerId);

  const canEditOrDelete = isOwner || isStaff;

  // 🔹 FAVORİYE EKLE / ÇIKAR (TOGGLE)
  const handleToggleFavorite = async () => {
    setIsFavoriting(true);
    try {
      const response = await authFetch(`${API_URL}/listings/listings/${id}/favorite/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(formatApiError(resData) || "Favori işlemi gerçekleştirilemedi.");
      }

      setIsFavorited(resData.is_favorited);
      toast.success(resData.is_favorited ? "İlan favorilere eklendi." : "İlan favorilerden çıkarıldı.");
    } catch (err) {
      if (err.isSessionExpired) return;
      toast.error(err.message || "Favori işlemi başarısız.");
    } finally {
      setIsFavoriting(false);
    }
  };

  // 🔹 ŞİKAYET ET (REPORT)
  const handleReportSubmit = async (e) => {
    e.preventDefault();

    setIsReporting(true);
    try {
      const response = await authFetch(`${API_URL}/listings/listings/${id}/report/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: reportDescription.trim(),
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(formatApiError(resData) || "Şikayet iletilemedi.");
      }

      toast.success("Şikayetiniz başarıyla iletildi. İncelenecektir.");
      setIsReportModalOpen(false);
      setReportDescription("");
    } catch (err) {
      if (err.isSessionExpired) return;
      toast.error(err.message || "Şikayet iletilemedi.");
    } finally {
      setIsReporting(false);
    }
  };

  // 🔹 İLAN SİLME
  const handleDelete = async () => {
    if (!window.confirm("Bu ev ilanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await authFetch(`${API_URL}/listings/houses/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(formatApiError(resData) || "İlan silinemedi.");
      }

      toast.success("Ev ilanı başarıyla silindi.");
      navigate("/houses");
    } catch (err) {
      if (err.isSessionExpired) return;
      toast.error(err.message || "Silme işlemi başarısız.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1720] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="min-h-screen bg-[#0F1720] flex flex-col items-center justify-center text-[#8B95A3]">
        <p className="mb-4">İlan bulunamadı.</p>
        <Link to="/houses" className="text-[#E8A33D] text-sm hover:underline">
          Ev listesine dön
        </Link>
      </div>
    );
  }

  // 📸 Fotoğrafları Topla (Galeri + Kapak veya Default)
  const uploadedImages = [
    ...(house.images && house.images.length > 0 ? house.images.map((img) => formatImgUrl(img.image)) : []),
    ...(house.image ? [formatImgUrl(house.image)] : [])
  ].filter(Boolean);

  const images = uploadedImages.length > 0 
    ? uploadedImages 
    : [defaultImages[house.id % defaultImages.length]];

  const activeImage = images[activeImageIndex] || images[0];

  const details = [
    { label: "İlan No", value: house.id },
    { label: "İlan Tarihi", value: house.listing_date },
    { label: "Oda Sayısı", value: house.number_of_rooms },
    { label: "Metrekare", value: house.meter_squared ? `${house.meter_squared} m²` : null },
    { label: "Bina Yaşı", value: house.building_aged },
    { label: "Bulunduğu Kat", value: house.floor },
    { label: "Toplam Kat Sayısı", value: house.number_of_floors },
    { label: "Krediye Uygunluk", value: house.credit_eligibility ? "Evet" : "Hayır" },
  ].filter((d) => d.value !== null && d.value !== undefined && d.value !== "");

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-5 text-[#EDEFF2] sm:px-6 lg:px-8 lg:py-7">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/houses"
          className="group mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#8B95A3] transition-colors hover:text-[#EDEFF2]"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Ev ilanlarına dön
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-[#EDEFF2] mb-1">
          {house.title || `${house.number_of_rooms || ""} ${house.city || ""}`.trim()}
        </h1>
        {house.city && (
          <p className="flex items-center gap-1.5 text-sm text-[#8B95A3] mb-6">
            <MapPin size={14} /> {house.city} {house.district ? `/ ${house.district}` : ""}
          </p>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sol: Görsel Galerisi, Favori Butonu ve Fiyat */}
          <div className="lg:w-[55%] shrink-0">
            {/* Büyük Ana Görsel */}
            <div className="relative rounded-xl overflow-hidden border border-[#232E3D] bg-[#161F2B] aspect-[4/3] group">
              <img src={activeImage} alt={house.title} className="w-full h-full object-cover transition-all duration-300" />

              {/* Fotoğraf Sayacı */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-3 rounded-md bg-[#0F1720]/80 px-2 py-1 text-xs font-medium text-[#EDEFF2] backdrop-blur-sm border border-[#232E3D]">
                  {activeImageIndex + 1} / {images.length}
                </div>
              )}

              {/* 💖 FAVORİ (KALP) BUTONU */}
              <button
                onClick={handleToggleFavorite}
                disabled={isFavoriting}
                title={isFavorited ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                className="absolute top-3 right-3 p-3 rounded-full bg-[#0F1720]/80 backdrop-blur-md border border-[#232E3D] text-[#EDEFF2] hover:scale-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                {isFavoriting ? (
                  <Loader2 size={20} className="animate-spin text-[#E8A33D]" />
                ) : (
                  <Heart
                    size={20}
                    className={`transition-colors ${
                      isFavorited
                        ? "fill-red-500 text-red-500"
                        : "text-[#8B95A3] hover:text-white"
                    }`}
                  />
                )}
              </button>
            </div>

            {/* Küçük Önizleme Kutucukları (Thumbnail Listesi) */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? "border-[#E8A33D] ring-2 ring-[#E8A33D]/20 scale-105"
                        : "border-[#232E3D] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Fiyat Kutusu & Karşılaştır Butonu */}
            <div className="mt-4 rounded-xl border border-[#232E3D] bg-[#161F2B] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8B95A3] mb-1">Fiyat</p>
                  <p className="text-2xl font-bold text-[#E8A33D]">
                    {house.price ? `${Number(house.price).toLocaleString("tr-TR")} TL` : "Belirtilmemiş"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    toggleCompare(
                      {
                        id: house.id,
                        title: house.title,
                        image: activeImage,
                        price: house.price,
                      },
                      "house"
                    )
                  }
                  className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                    isInCompare(house.id)
                      ? "border-[#E8A33D] bg-[#E8A33D]/15 text-[#E8A33D]"
                      : "border-[#232E3D] bg-[#0F1720] text-[#8B95A3] hover:border-[#4A5568] hover:text-[#EDEFF2]"
                  }`}
                >
                  <Scale size={15} />
                  <span>{isInCompare(house.id) ? "Karşılaştırmada" : "Karşılaştır"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Key-Value Tablo + Aksiyon Butonları */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="rounded-xl border border-[#232E3D] bg-[#161F2B] overflow-hidden">
              {details.map((d, i) => (
                <div
                  key={d.label}
                  className={`flex justify-between px-5 py-3 text-sm ${
                    i % 2 === 0 ? "bg-[#161F2B]" : "bg-[#1A2430]"
                  }`}
                >
                  <span className="text-[#8B95A3]">{d.label}</span>
                  <span className="text-[#EDEFF2] font-medium text-right">{d.value}</span>
                </div>
              ))}
            </div>

            {/* 🛠️ SADECE İLAN SAHİBİNE ÖZEL BUTONLAR */}
            {isOwner && (
              <div className="flex gap-3">
                <Link
                  to={`/ev-ilan-guncelle/${house.id}`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#E8A33D]/10 border border-[#E8A33D]/30 px-5 py-3 text-sm font-semibold text-[#E8A33D] hover:bg-[#E8A33D] hover:text-[#0F1720] transition-colors"
                >
                  <Pencil size={16} />
                  İlanı Düzenle
                </Link>

                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      İlanı Sil
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 🚩 DİĞER KULLANICILARA ÖZEL (İlanı Şikayet Et) */}
            {!isOwner && (
              <div className="pt-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#161F2B] border border-[#232E3D] hover:border-red-500/40 px-4 py-2.5 text-xs font-medium text-[#8B95A3] hover:text-red-400 transition-all"
                >
                  <Flag size={14} />
                  İlanı Şikayet Et
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 ŞİKAYET MODALI */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#232E3D] bg-[#161F2B] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#EDEFF2] flex items-center gap-2">
                <Flag size={18} className="text-red-400" />
                İlanı Şikayet Et
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-[#8B95A3] hover:text-[#EDEFF2] p-1 rounded-lg hover:bg-[#232E3D]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-[#8B95A3] mb-1.5">
                  Şikayet Gerekçeniz (Açıklama)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="İlan ile ilgili şikayetinizi yazınız (örn: Hatalı fiyat, sahte ilan, ulaşılamıyor vb.)..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#232E3D] bg-[#0F1720] px-3.5 py-2.5 text-sm text-[#EDEFF2] placeholder-[#8B95A3]/50 focus:border-[#E8A33D] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded-xl border border-[#232E3D] px-4 py-2 text-xs font-medium text-[#8B95A3] hover:bg-[#232E3D] hover:text-[#EDEFF2] transition-colors"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={isReporting}
                  className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {isReporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Şikayeti Gönder"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
