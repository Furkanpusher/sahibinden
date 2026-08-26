import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio,
  Trash2,
  Tag,
  FileEdit,
  Search,
  ExternalLink,
  Loader2,
  Plus,
  Clock,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { getAlarms, toggleAlarm, deleteAlarm, formatApiError } from "../api";
import CreateAlarmModal from "./CreateAlarmModal";
import { getAlarmTypeMeta } from "../data/alarmConfig";

// time helper
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return null;
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Az önce";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
};

// 5 dakikalık periyot için bir sonraki taramaya kalan süreyi hesapla
const getNextScanRemaining = (alarm, now) => {
  const baseTimeStr = alarm.last_checked || alarm.created_at;
  if (!baseTimeStr) return "5:00";
  const baseDate = new Date(baseTimeStr).getTime();
  const elapsedSec = Math.max(0, Math.floor((now - baseDate) / 1000));
  const remainingSec = 300 - (elapsedSec % 300);
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function AlarmDropdown() {
  const [alarms, setAlarms] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const activeCount = alarms.filter((a) => a.is_active).length;

  const fetchAlarmsList = async () => {
    try {
      setLoading(true);
      const data = await getAlarms();
      setAlarms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Alarmlar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarmsList();
  }, []);

  // Dropdown açıkken canlı geri sayım için saniyelik zamanlayıcı
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchAlarmsList();
    }
  };

  // Alarm Aktif / Pasif Toggle
  const handleToggle = async (e, alarm) => {
    e.stopPropagation();
    try {
      setTogglingId(alarm.id);
      await toggleAlarm(alarm.id);
      const isNowActive = !alarm.is_active;

      setAlarms((prev) =>
        prev.map((a) => (a.id === alarm.id ? { ...a, is_active: isNowActive } : a))
      );

      toast.success(
        isNowActive
          ? "Alarm aktif edildi."
          : "Alarm pasif duruma getirildi."
      );
    } catch (err) {
      toast.error(formatApiError(err) || "Alarm durumu güncellenemedi.");
    } finally {
      setTogglingId(null);
    }
  };

  // Alarm Silme
  const handleDelete = async (e, alarmId) => {
    e.stopPropagation();
    try {
      setDeletingId(alarmId);
      await deleteAlarm(alarmId);
      setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
      toast.success("Alarm başarıyla silindi.");
    } catch (err) {
      toast.error(formatApiError(err) || "Alarm silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  // İlana Gitme
  const handleNavigateToListing = (listing) => {
    if (!listing) return;
    setIsOpen(false);
    const path =
      listing.listing_type === "house"
        ? `/houses/${listing.id}`
        : `/cars/${listing.id}`;
    navigate(path);
  };

  // Alarm Tipi Etiket Bilgisi (alarmConfig'den dinamik alınır)
  const getAlarmTypeInfo = (alarm) => {
    const meta = getAlarmTypeMeta(alarm.alarm_type);
    const IconComponent = meta.icon;
    return {
      title: meta.title,
      icon: <IconComponent size={13} className={meta.iconColor} />,
      color: meta.color,
    };
  };


  // Kriter Parametrelerini Formatlama (new_listing_check)
  const formatParams = (params = {}) => {
    const tags = [];
    if (params.category) {
      tags.push(params.category === "house" ? "Konut" : "Otomobil");
    }
    if (params.brands && params.brands.length) {
      tags.push(Array.isArray(params.brands) ? params.brands.join(", ") : params.brands);
    }
    if (params.min_price) {
      tags.push(`Min: ₺${Number(params.min_price).toLocaleString("tr-TR")}`);
    }
    if (params.max_price) {
      tags.push(`Maks: ₺${Number(params.max_price).toLocaleString("tr-TR")}`);
    }
    if (params.max_km) {
      tags.push(`Maks: ${Number(params.max_km).toLocaleString("tr-TR")} KM`);
    }
    if (params.transmission_types && params.transmission_types.length) {
      tags.push(
        Array.isArray(params.transmission_types)
          ? params.transmission_types.join(", ")
          : params.transmission_types
      );
    }
    if (params.number_of_rooms && params.number_of_rooms.length) {
      tags.push(
        Array.isArray(params.number_of_rooms)
          ? params.number_of_rooms.join(", ")
          : params.number_of_rooms
      );
    }
    if (params.min_meter_squared) {
      tags.push(`Min: ${params.min_meter_squared} m²`);
    }
    return tags;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Alarm Butonu */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${isOpen
          ? "border-[#E8A33D] bg-[#1C2733] text-[#E8A33D]"
          : "border-[#232E3D] bg-[#161F2B] text-[#EDEFF2] hover:border-[#E8A33D]/50 hover:bg-[#1C2733]"
          }`}
        title="Alarmlarım"
      >
        <Radio
          size={18}
          className={activeCount > 0 ? "text-[#E8A33D]" : "text-[#8B95A3]"}
        />

        {/* Aktif Alarm Rozeti */}
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E8A33D] px-1 text-[11px] font-bold text-[#0F1720] shadow-md shadow-[#E8A33D]/20">
            {activeCount}
          </span>
        )}
      </button>

      {/* Açılır Panel */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-[#232E3D] bg-[#161F2B] p-2 shadow-2xl shadow-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#232E3D] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#EDEFF2]">Alarmlarım</span>
              <span className="rounded-md bg-[#232E3D] px-2 py-0.5 text-[11px] font-medium text-[#8B95A3]">
                {activeCount}/5 Aktif
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs text-[#E8A33D] hover:text-[#F0B058] transition-colors"
                title="Yeni Alarm Oluştur"
              >
                <Plus size={13} />
                Yeni Ekle
              </button>
              <button
                onClick={fetchAlarmsList}
                disabled={loading}
                className="text-xs text-[#8B95A3] hover:text-[#EDEFF2] transition-colors"
                title="Yenile"
              >
                Yenile
              </button>
            </div>
          </div>

          {/* Alarm Listesi */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#232E3D]/50 p-1 space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-xs text-[#8B95A3]">
                <Loader2 size={20} className="animate-spin text-[#E8A33D] mb-2" />
                Alarmlar yükleniyor...
              </div>
            ) : alarms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#232E3D]/60 text-[#8B95A3] mb-2">
                  <Radio size={20} />
                </div>
                <p className="text-xs font-semibold text-[#EDEFF2]">Kayıtlı alarmınız yok</p>
                <p className="text-[11px] text-[#8B95A3] mt-1 max-w-[240px]">
                  İlan detay sayfalarından veya arama filtrelerinden 5 adede kadar alarm oluşturabilirsiniz.
                </p>
              </div>
            ) : (
              alarms.map((alarm) => {
                const typeInfo = getAlarmTypeInfo(alarm);
                const paramTags =
                  alarm.alarm_type === "new_listing_check"
                    ? formatParams(alarm.params)
                    : [];

                return (
                  <div
                    key={alarm.id}
                    className={`rounded-xl p-3 transition-all duration-200 border ${alarm.is_active
                      ? "bg-[#1C2733]/70 border-[#232E3D] hover:border-[#E8A33D]/30"
                      : "bg-[#121A24]/50 border-transparent opacity-60 hover:opacity-90"
                      }`}
                  >
                    {/* Üst Kısım: Alarm Türü + Butonlar */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${typeInfo.color}`}
                        >
                          {typeInfo.icon}
                          {typeInfo.title}
                        </span>
                        <span className="text-[10px] text-[#6B7583]">
                          {alarm.created_at
                            ? new Date(alarm.created_at).toLocaleDateString("tr-TR")
                            : ""}
                        </span>
                      </div>

                      {/* Aksiyon Butonları (Toggle + Sil) */}
                      <div className="flex items-center gap-2">
                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={(e) => handleToggle(e, alarm)}
                          disabled={togglingId === alarm.id}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${alarm.is_active ? "bg-[#10B981]" : "bg-[#232E3D]"
                            }`}
                          title={alarm.is_active ? "Pasif Yap" : "Aktif Yap"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${alarm.is_active ? "translate-x-4" : "translate-x-0"
                              }`}
                          />
                        </button>

                        {/* Silme Butonu */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, alarm.id)}
                          disabled={deletingId === alarm.id}
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-[#8B95A3] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Alarmı Sil"
                        >
                          {deletingId === alarm.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* İlan Detay Bilgisi (İlan bazlı alarmlar için) */}
                    {alarm.listing && (
                      <div
                        onClick={() => handleNavigateToListing(alarm.listing)}
                        className="group flex items-center justify-between gap-2 rounded-lg bg-[#161F2B] p-2 hover:bg-[#232E3D]/70 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[#EDEFF2] truncate group-hover:text-[#E8A33D] transition-colors">
                            {alarm.listing.title}
                          </p>
                          <p className="text-[11px] font-semibold text-[#E8A33D] mt-0.5">
                            ₺{Number(alarm.listing.price).toLocaleString("tr-TR")}
                          </p>
                        </div>
                        <ExternalLink
                          size={13}
                          className="text-[#8B95A3] shrink-0 group-hover:text-[#EDEFF2] transition-colors"
                        />
                      </div>
                    )}

                    {/* Kriter Parametreleri (new_listing_check alarmları için) */}
                    {alarm.alarm_type === "new_listing_check" && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {paramTags.length > 0 ? (
                          paramTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded bg-[#161F2B] px-2 py-0.5 text-[10px] text-[#A1AAB7] border border-[#232E3D]"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-[#6B7583]">
                            Tüm yeni ilanlar
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tarama / Takip Durum Çubuğu */}
                    <div className="mt-2.5 pt-2 border-t border-[#232E3D]/50 flex items-center justify-between text-[10px]">
                      {alarm.alarm_type === "new_listing_check" ? (
                        <>
                          <div className="flex items-center gap-1 text-[#8B95A3]">
                            <Clock size={11} className="text-[#10B981]" />
                            <span>
                              {alarm.last_checked
                                ? `Son tarama: ${formatTimeAgo(alarm.last_checked)}`
                                : "İlk tarama bekleniyor"}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-1.5 font-mono text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/25"
                            title="Bir sonraki otomatik taramaya kalan süre"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            <span>{getNextScanRemaining(alarm, currentTime)} / 5:00</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 text-[#8B95A3]">
                            <Zap size={11} className="text-[#E8A33D]" />
                            <span>Anlık İlan Takibi</span>
                          </div>
                          <span className="text-[#E8A33D]/90 font-medium bg-[#E8A33D]/10 px-1.5 py-0.5 rounded border border-[#E8A33D]/20">
                            Fiyat/Detay değişiminde
                          </span>
                        </>
                      )}
                    </div>
                  </div>


                );
              })
            )}
          </div>

          {/* Footer Bilgilendirmesi */}
          <div className="border-t border-[#232E3D] px-3 py-2 text-[10px] text-[#6B7583] text-center">
            Maksimum 5 aktif alarm oluşturabilirsiniz.
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateAlarmModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onAlarmCreated={fetchAlarmsList}
        />
      )}
    </div>
  );
}

