import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldAlert, Trash2, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function StaffReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem("access") || localStorage.getItem("token") || localStorage.getItem("access_token");
  const isStaff = localStorage.getItem("is_staff") === "true";
  const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8001/api";

  // 1. Staff Yetki Kontrolü ve Şikayetleri Çekme
  useEffect(() => {
    if (!token || !isStaff) {
      toast.error("Bu sayfaya sadece yetkili (staff) kullanıcılar erişebilir.");
      navigate("/");
      return;
    }

    fetchReports();
  }, [token, isStaff]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/listings/staff/reports/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Şikayet listesi yüklenemedi.");
      }

      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Şikayeti Kapat / Yoksay (İlan Silinmez)
  const handleDismissReport = async (reportId) => {
    if (!window.confirm("Bu şikayeti kapatmak istediğinize emin misiniz? (İlan silinmeyecektir)")) return;

    setProcessingId(reportId);
    try {
      const res = await fetch(`${API_URL}/listings/staff/reports/${reportId}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Şikayet silinemedi.");

      // Listeden çıkar
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success("Şikayet kapatıldı.");
    } catch (err) {
      toast.error(err.message || "Şikayet kapatılamadı.");
    } finally {
      setProcessingId(null);
    }
  };

  // 🔹 İlanı Tamamen Sil (Moderasyon Kararı)
  const handleDeleteListing = async (reportId, listingId) => {
    if (!window.confirm("DİKKAT: Bu ilanı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;

    setProcessingId(reportId);
    try {
      const res = await fetch(`${API_URL}/listings/staff/listings/${listingId}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("İlan silinemedi.");

      toast.success("İlan başarıyla yayından kaldırıldı.");
      // Bu ilana ait tüm şikayetleri listeden temizle
      setReports((prev) => prev.filter((r) => r.listing?.id !== listingId));
    } catch (err) {
      toast.error(err.message || "İlan silinemedi.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-6 text-[#EDEFF2] sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/"
          className="group mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#8B95A3] hover:text-[#EDEFF2] transition-colors"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Ana Sayfaya Dön
        </Link>

        {/* Başlık */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#232E3D]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#EDEFF2]">Moderasyon Paneli</h1>
              <p className="text-xs text-[#8B95A3]">Kullanıcılar tarafından şikayet edilen ilanlar</p>
            </div>
          </div>
          <span className="rounded-full bg-[#161F2B] border border-[#232E3D] px-3 py-1 text-xs text-[#8B95A3]">
            Toplam {reports.length} Şikayet
          </span>
        </div>

        {/* Yükleniyor Durumu */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#E8A33D] mb-3" />
            <p className="text-sm text-[#8B95A3]">Şikayetler yükleniyor...</p>
          </div>
        )}

        {/* Hata Durumu */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Şikayet Yok Durumu */}
        {!loading && !error && reports.length === 0 && (
          <div className="rounded-2xl border border-[#232E3D] bg-[#161F2B] p-12 text-center">
            <Check size={40} className="mx-auto text-[#6FCF97] mb-3" />
            <h3 className="text-base font-semibold text-[#EDEFF2]">Hiç şikayet bulunmuyor</h3>
            <p className="text-xs text-[#8B95A3] mt-1">İncelenmeyi bekleyen aktif bir rapor yok.</p>
          </div>
        )}

        {/* Şikayet Listesi */}
        {!loading && !error && reports.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => {
            
            // 📍 1. BURAYA EKLİYORUZ (İlanın tipine göre link belirleniyor)
            const detailUrl = report.listing?.listing_type === "house"
                ? `/house/${report.listing?.id}`
                : `/car/${report.listing?.id}`;
            return (
                <div
                key={report.id}
                className="rounded-2xl border border-[#232E3D] bg-[#161F2B] p-5 transition-all hover:border-[#2D3C4F]"
                >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    {/* Sol Taraf: İlan Bilgisi */}
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/20">
                        İlan #{report.listing?.id || "?"}
                        </span>
                        <span className="text-xs text-[#8B95A3]">
                        {report.report_date ? new Date(report.report_date).toLocaleDateString("tr-TR") : ""}
                        </span>
                    </div>
                    {/* İlan Başlığı ve Buton */}
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-base font-semibold text-[#EDEFF2]">
                        {report.listing?.title || "İlan Başlığı"}
                        </h3>
                        {/* 📍 2. BURAYA "İlanı İncele" BUTONU OLARAK BAĞLIYORUZ */}
                        <Link
                        to={detailUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8A33D]/10 border border-[#E8A33D]/30 px-2.5 py-1 text-xs font-medium text-[#E8A33D] hover:bg-[#E8A33D] hover:text-[#0F1720] transition-colors"
                        title="İlanı İncele"
                        >
                        <ExternalLink size={12} />
                        İlanı İncele
                        </Link>
                    </div>
                    {/* Şikayet Açıklaması */}
                    <div className="rounded-xl bg-[#0F1720] border border-[#232E3D] p-3 text-xs text-[#EDEFF2] flex items-start gap-2">
                        <AlertTriangle size={15} className="text-[#E8A33D] shrink-0 mt-0.5" />
                        <div>
                        <span className="text-[#8B95A3] block mb-0.5 font-medium">Şikayet Açıklaması:</span>
                        <p className="leading-relaxed">{report.description || "Açıklama belirtilmemiş."}</p>
                        </div>
                    </div>
                    </div>
                    {/* Sağ Taraf: Aksiyon Butonları (Şikayeti Kapat & İlanı Sil) */}
                    <div className="flex sm:flex-col gap-2 shrink-0 sm:w-40">
                    <button
                        onClick={() => handleDismissReport(report.id)}
                        disabled={processingId === report.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#232E3D] bg-[#1C2733] px-3 py-2.5 text-xs font-medium text-[#8B95A3] hover:text-[#EDEFF2] hover:bg-[#232E3D] transition-colors disabled:opacity-50"
                    >
                        Şikayeti Kapat
                    </button>
                    <button
                        onClick={() => handleDeleteListing(report.id, report.listing?.id)}
                        disabled={processingId === report.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600/10 border border-red-500/30 px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={13} />
                        İlanı Kaldır
                    </button>
                    </div>
                </div>
                </div>
            );
            })}
        </div>
        )}

      </div>
    </div>
  );
}
