import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, TrendingDown, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getNotifications, markNotificationsAsRead, deleteNotification, formatApiError } from "../api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
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

  // Tekil bildirim silme
  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation(); // İlana yönlenmeyi engelle
    try {
      setDeletingId(notifId);
      await deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      toast.success("Bildirim silindi.");
    } catch (err) {
      toast.error(formatApiError(err) || "Bildirim silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  // Bildirime tıklandığında sadece bu bildirimi okundu yap ve ilana git
  const handleClickNotification = async (notif) => {
    setIsOpen(false);

    if (!notif.is_read) {
      try {
        await markNotificationsAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Bildirim okundu yapılamadı:", err);
      }
    }

    if (!notif.listing) return;
    const path = notif.listing.listing_type === "house"
      ? `/houses/${notif.listing.id}`
      : `/cars/${notif.listing.id}`;
    navigate(path);
  };

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifs();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Çan Butonu */}
      <button
        type="button"
        onClick={handleToggleOpen}
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
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-[#232E3D] bg-[#161F2B] p-2 shadow-2xl shadow-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
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
                  className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    n.is_read
                      ? "opacity-60 bg-transparent hover:opacity-100 hover:bg-[#1C2733]/40"
                      : "opacity-100 bg-[#1C2733] border border-[#E8A33D]/25 shadow-sm hover:bg-[#232E3D]"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      n.is_read ? "bg-[#232E3D]/50 text-[#8B95A3]" : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    <TrendingDown size={16} />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <p
                      className={`text-xs truncate ${
                        n.is_read ? "font-normal text-[#8B95A3]" : "font-semibold text-[#EDEFF2]"
                      }`}
                    >
                      {n.listing?.title || "İlan"}
                    </p>
                    <p className={`text-xs mt-0.5 ${n.is_read ? "text-[#6B7583]" : "text-[#A1AAB7]"}`}>
                      {n.message}
                    </p>
                    {(() => {
                      let oldP = n.old_price;
                      let newP = n.new_price;
                      if ((oldP == null || newP == null) && n.message) {
                        const match = n.message.match(/(\d+(?:\.\d+)?)\s*->\s*(\d+(?:\.\d+)?)/);
                        if (match) {
                          oldP = match[1];
                          newP = match[2];
                        }
                      }
                      if (oldP != null && newP != null && !isNaN(Number(oldP)) && !isNaN(Number(newP))) {
                        return (
                          <div className="mt-1 flex items-center gap-2 text-[11px]">
                            <span
                              className={`line-through ${
                                n.is_read ? "text-[#6B7583]" : "text-red-400/80"
                              }`}
                            >
                              ₺{Number(oldP).toLocaleString("tr-TR")}
                            </span>
                            <span className="text-[#8B95A3]">→</span>
                            <span
                              className={`font-semibold ${
                                n.is_read ? "text-[#8B95A3]" : "text-emerald-400"
                              }`}
                            >
                              ₺{Number(newP).toLocaleString("tr-TR")}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Sağ Üst Alan: Okunmamış Noktası ve Sil Butonu */}
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-[#E8A33D] shadow-sm shadow-[#E8A33D] animate-pulse" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(e, n.id)}
                      disabled={deletingId === n.id}
                      title="Bildirimi Sil"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#6B7583] hover:text-red-400 hover:bg-red-500/15 transition-all"
                    >
                      {deletingId === n.id ? (
                        <Loader2 size={12} className="animate-spin text-red-400" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

