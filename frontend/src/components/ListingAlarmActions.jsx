import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, ChevronDown, Loader2, Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { createAlarm, formatApiError } from "../api";
import { LISTING_BASED_ALARMS } from "../data/alarmConfig";

export default function ListingAlarmActions({ listingId, isOwner = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Dışarı tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // İlan sahibi kendi ilanına alarm kuramaz
  if (isOwner || !listingId) return null;

  const handleCreateAlarm = async (alarmConfig) => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("access");

    if (!token) {
      toast.error("Alarm kurmak için lütfen giriş yapınız.");
      navigate("/login");
      return;
    }

    try {
      setLoadingType(alarmConfig.type);
      await createAlarm({
        alarm_type: alarmConfig.type,
        listing_id: Number(listingId),
        params: {},
      });

      toast.success(
        `${alarmConfig.label} başarıyla kuruldu! Bildirimlerinizi üst menüden takip edebilirsiniz.`
      );
      setIsOpen(false);
    } catch (err) {
      toast.error(formatApiError(err) || "Alarm kurulamadı.");
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      {/* Alarm Kur Butonu (Büyük ve Belirgin) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#161F2B] border border-[#232E3D] hover:border-[#E8A33D] hover:bg-[#1C2733] px-4 py-3 text-sm sm:text-[15px] font-bold text-[#EDEFF2] hover:text-[#E8A33D] transition-all shadow-md group"
      >
        <Radio size={18} className="text-[#E8A33D] group-hover:scale-110 transition-transform" />
        <span>Bu İlan İçin Alarm Kur</span>
        <ChevronDown
          size={16}
          className={`text-[#8B95A3] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#E8A33D]" : "group-hover:text-[#EDEFF2]"
          }`}
        />
      </button>

      {/* Açılır Alarm Seçenekleri Menüsü */}
      {isOpen && (
        <div className="absolute right-0 z-40 mt-2 w-full min-w-[300px] sm:min-w-[340px] rounded-2xl border border-[#232E3D] bg-[#161F2B] p-2.5 shadow-2xl shadow-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-[#232E3D] mb-1.5 flex items-center justify-between">
            <p className="text-xs font-bold text-[#8B95A3] uppercase tracking-wider">
              Alarm Türünü Seçin
            </p>
            <span className="text-[11px] text-[#6B7583]">Tek Tıkla Kur</span>
          </div>

          <div className="space-y-1.5">
            {LISTING_BASED_ALARMS.map((alarm) => {
              const Icon = alarm.icon || Bell;
              const isLoading = loadingType === alarm.type;

              return (
                <button
                  key={alarm.type}
                  type="button"
                  onClick={() => handleCreateAlarm(alarm)}
                  disabled={loadingType !== null}
                  className="w-full flex items-start gap-3 p-3 rounded-xl text-left hover:bg-[#1C2733] border border-transparent hover:border-[#232E3D] transition-all group disabled:opacity-50"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#232E3D] text-[#8B95A3] group-hover:bg-[#E8A33D]/20 group-hover:text-[#E8A33D] transition-colors shadow-sm">
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin text-[#E8A33D]" />
                    ) : (
                      <Icon size={18} className={alarm.iconColor} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#EDEFF2] group-hover:text-[#E8A33D] transition-colors">
                      {alarm.label}
                    </p>
                    <p className="text-xs text-[#8B95A3] mt-1 leading-snug">
                      {alarm.description}
                    </p>
                  </div>

                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#232E3D]/50 text-[#8B95A3] group-hover:bg-[#E8A33D] group-hover:text-[#0F1720] transition-colors">
                    <Plus size={14} className="font-bold" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

