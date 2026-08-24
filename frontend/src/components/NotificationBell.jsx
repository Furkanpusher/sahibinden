import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, TrendingDown, CheckCheck } from "lucide-react";
import { getNotifications, markNotificationsAsRead } from "../api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Bildirimleri API'den çek
  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Bildirimler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tümünü okundu yap
  const handleMarkAllRead = async () => {
    try {
      await markNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Okundu işaretlenemedi:", err);
    }
  };

  // Bildirime tıklandığında ilana git
  const handleClickNotification = (notif) => {
    setIsOpen(false);
    if (!notif.listing) return;
    const path = notif.listing.listing_type === "house"
      ? `/houses/${notif.listing.id}`
      : `/cars/${notif.listing.id}`;
    navigate(path);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Çan Butonu */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#232E3D] bg-[#161F2B] text-[#EDEFF2] hover:border-[#E8A33D]/50 hover:bg-[#1C2733] transition-all"
        title="Bildirimler"
      >
        <Bell size={18} className={unreadCount > 0 ? "text-[#E8A33D]" : "text-[#8B95A3]"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Açılır Panel */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-[#232E3D] bg-[#161F2B] p-2 shadow-2xl shadow-black/80 backdrop-blur-md">
          {/* Başlık ve Buton */}
          <div className="flex items-center justify-between border-b border-[#232E3D] px-3 py-2.5">
            <span className="text-sm font-semibold text-[#EDEFF2]">Bildirimler</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-[#E8A33D] hover:underline"
              >
                <CheckCheck size={14} />
                Tümünü Okundu Yap
              </button>
            )}
          </div>

          {/* Bildirim Listesi */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#232E3D]/50">
            {loading ? (
              <div className="p-4 text-center text-xs text-[#8B95A3]">Yükleniyor...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8B95A3]">Henüz bildiriminiz yok.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${n.is_read ? "opacity-70 hover:bg-[#1C2733]" : "bg-[#1C2733]/60 hover:bg-[#1C2733]"
                    }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <TrendingDown size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#EDEFF2] truncate">
                      {n.listing?.title || "İlan"}
                    </p>
                    <p className="text-xs text-[#8B95A3] mt-0.5">{n.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <span className="text-red-400 line-through">₺{Number(n.old_price).toLocaleString("tr-TR")}</span>
                      <span className="font-semibold text-emerald-400">₺{Number(n.new_price).toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-[#E8A33D] mt-1 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
