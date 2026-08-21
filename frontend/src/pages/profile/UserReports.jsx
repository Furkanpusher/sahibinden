import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Flag, 
  Loader2, 
  SearchX, 
  Car, 
  Home as HomeIcon, 
  Calendar, 
  MapPin,
  AlertTriangle,
  ArrowUpRight
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

export default function UserReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    // 🎯 BURASI: /api/listings/reports/ endpoint'ine istek atar
    fetch("http://localhost:8001/api/listings/reports/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Raporlar yüklenirken bir hata oluştu.");
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const sorted = [...list].sort((a, b) => b.id - a.id);
        setReports(sorted);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const formatPrice = (price) => {
    if (!price) return "0 TL";
    return Number(price).toLocaleString("tr-TR") + " TL";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-5 text-[#EDEFF2] sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-6xl">
        
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <Flag size={20} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#EDEFF2] sm:text-3xl">
                  Rapor Ettiğim İlanlar
                </h1>
              </div>
              <p className="mt-1 text-sm text-[#8B95A3]">
                Daha önce moderasyona bildirdiğin şüpheli veya kural dışı ilanlar.
              </p>
            </div>

            {!loading && reports.length > 0 && (
              <span className="w-fit rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-1.5 text-xs font-medium text-[#8B95A3]">
                {reports.length} rapor bildirildi
              </span>
            )}
          </div>
        </header>

        {/* İçerik */}
        <main>
          {loading && (
            <div className="flex min-h-[350px] flex-col items-center justify-center text-[#8B95A3]">
              <Loader2 size={36} className="mb-3 animate-spin text-[#E8A33D]" />
              <p className="text-sm font-medium">Raporlarınız getiriliyor...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[#E88080]/30 bg-[#E88080]/10 p-5 text-center text-[#E88080]">
              <p className="text-sm font-medium">Hata: {error}</p>
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#2B3747] bg-[#161F2B]/40 p-10 text-center">
              <SearchX size={44} className="mb-3 text-[#667384]" />
              <h3 className="text-lg font-semibold text-[#EDEFF2]">Rapor Edilen İlan Yok</h3>
              <p className="mt-1 max-w-sm text-sm text-[#8B95A3]">
                Henüz moderatörlere bildirdiğiniz herhangi bir ilan bulunmuyor.
              </p>
            </div>
          )}

          {/* Rapor Listesi */}
          {!loading && !error && reports.length > 0 && (
            <div className="space-y-4">
              {reports.map((item) => {
                const listing = item.listing;
                if (!listing) return null;

                const isCar = listing.listing_type === "car";
                const detailUrl = isCar ? `/cars/${listing.id}` : `/houses/${listing.id}`;
                const defaultImg = isCar
                  ? carImages[listing.id % carImages.length]
                  : houseImages[listing.id % houseImages.length];

                return (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-[#232E3D] bg-[#161F2B] p-4 transition-all hover:border-[#4A5568]"
                  >
                    {/* Sol: İlan Görseli ve Bilgisi */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <Link
                        to={detailUrl}
                        className="group/img relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[#0F1720] border border-[#232E3D] transition-transform hover:scale-105"
                      >
                        <img
                          src={defaultImg}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-[#0F1720]/80 px-1.5 py-0.5 text-[9px] font-semibold text-[#EDEFF2]">
                          {isCar ? <Car size={10} className="text-[#E8A33D]" /> : <HomeIcon size={10} className="text-[#3B82F6]" />}
                          {isCar ? "Araç" : "Ev"}
                        </span>
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link to={detailUrl} className="text-sm font-bold text-[#E8A33D] hover:underline">
                            {formatPrice(listing.price)}
                          </Link>
                        </div>

                        <Link to={detailUrl} className="block">
                          <h3 className="text-sm font-medium text-[#EDEFF2] truncate mt-0.5 transition-colors hover:text-[#E8A33D]" title={listing.title}>
                            {listing.title}
                          </h3>
                        </Link>

                        <div className="mt-1 flex items-center gap-3 text-xs text-[#8B95A3]">
                          {(listing.city || listing.district) && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {[listing.city, listing.district].filter(Boolean).join(", ")}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[#667384]">
                            <Calendar size={12} />
                            Rapor Tarihi: {formatDate(item.report_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sağ: Şikayet Gerekçesi & İlana Git Butonu */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-[#232E3D] pt-3 md:pt-0">
                      {item.description && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-[#0F1720] border border-[#232E3D] px-3 py-1.5 text-xs text-[#E88080]">
                          <AlertTriangle size={13} className="shrink-0" />
                          <span className="max-w-[200px] truncate" title={item.description}>
                            "{item.description}"
                          </span>
                        </div>
                      )}

                      <Link
                        to={detailUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1C2733] border border-[#232E3D] px-3.5 py-2 text-xs font-semibold text-[#EDEFF2] hover:bg-[#E8A33D] hover:text-[#0F1720] hover:border-[#E8A33D] transition-all"
                      >
                        İlanı Gör
                        <ArrowUpRight size={14} />
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
