import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  ChevronDown,
  Heart,
  Layers,
  Flag,
  LogOut,
  LogIn
} from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Kullanıcı ve Token Kontrolü
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
  let username = "Kullanıcı";

  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    if (userObj.username) username = userObj.username;
  } catch (e) {
    // parse hatası olursa default kalır
  }

  // Menü dışına tıklandığında dropdown'ı kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Çıkış Yap Fonksiyonu
  const handleLogout = () => {
    localStorage.clear();
    setIsOpen(false);
    navigate("/login");
  };

  // 1. Giriş Yapılmamışsa "Giriş Yap" Butonu Göster
  if (!token) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-2 rounded-lg bg-[#E8A33D] px-4 py-2 text-sm font-semibold text-[#0F1720] hover:bg-[#F0B058] transition-colors shadow-md"
      >
        <LogIn size={16} />
        Giriş Yap
      </Link>
    );
  }

  // 2. Giriş Yapılmışsa Avatar + Kullanıcı Adı + Dropdown Göster
  return (
    <div className="flex items-center gap-2.5">
      <NotificationBell />
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-xl border border-[#232E3D] bg-[#161F2B] px-3.5 py-2 text-sm font-medium text-[#EDEFF2] hover:border-[#E8A33D]/50 hover:bg-[#1C2733] transition-all shadow-sm"
        >
          {/* Avatar İkonu / Baş Harf */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8A33D] text-xs font-bold text-[#0F1720]">
            {username ? username[0].toUpperCase() : <User size={14} />}
          </div>

          {/* Kullanıcı Adı */}
          <span className="max-w-[120px] truncate text-xs sm:text-sm font-medium">
            {username}
          </span>

          {/* Açılır Ok */}
          <ChevronDown
            size={16}
            className={`text-[#8B95A3] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#E8A33D]" : ""
              }`}
          />
        </button>

        {/* Açılır Menü (Dropdown) */}
        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-xl border border-[#232E3D] bg-[#161F2B] p-1.5 shadow-2xl shadow-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100">

            {/* Kullanıcı Bilgi Başlığı */}
            <div className="px-3 py-2 border-b border-[#232E3D] mb-1">
              <p className="text-xs text-[#8B95A3]">Giriş yapıldı</p>
              <p className="text-xs font-semibold text-[#EDEFF2] truncate">
                {username}
              </p>
            </div>

            <div className="space-y-0.5">
              {/* Favorilerim */}
              <Link
                to="/favorilerim"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#EDEFF2] hover:bg-[#1C2733] hover:text-[#E8A33D] transition-colors"
              >
                <Heart size={16} className="text-[#E8A33D]" />
                Favorilerim
              </Link>

              {/* İlanlarım */}
              <Link
                to="/ilanlarim"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#EDEFF2] hover:bg-[#1C2733] hover:text-[#E8A33D] transition-colors"
              >
                <Layers size={16} className="text-[#3B82F6]" />
                İlanlarım
              </Link>

              {/* Rapor Edilen İlanlar */}
              <Link
                to="/raporlarim"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#EDEFF2] hover:bg-[#1C2733] hover:text-[#E8A33D] transition-colors"
              >
                <Flag size={16} className="text-[#EF4444]" />
                Rapor Edilen İlanlar
              </Link>
            </div>

            {/* Çıkış Yap Butonu */}
            <div className="mt-1 border-t border-[#232E3D] pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut size={16} />
                Çıkış Yap
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
