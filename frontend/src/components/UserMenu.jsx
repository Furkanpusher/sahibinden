import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  ChevronDown,
  Heart,
  UserCheck,
  Layers,
  Flag,
  LogOut,
  LogIn
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import AlarmDropdown from "./AlarmDropdown";
import { authFetch } from "../api";

const BACKEND_BASE = "http://127.0.0.1:8001";
const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8001/api";

const formatImgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Kullanıcı ve Token State
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
  const [userData, setUserData] = useState({
    username: "Kullanıcı",
    email: "",
    profile_picture: null
  });

  const loadUserData = () => {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      setUserData({
        username: userObj.username || localStorage.getItem("username") || "Kullanıcı",
        email: userObj.email || "",
        profile_picture: userObj.profile_picture || null
      });
    } catch {
      setUserData({
        username: localStorage.getItem("username") || "Kullanıcı",
        email: "",
        profile_picture: null
      });
    }
  };

  useEffect(() => {
    loadUserData();

    // Giriş yapılmışsa sunucudan güncel profil bilgilerini al ve senkronize et
    if (token) {
      authFetch(`${API_URL}/accounts/my-profile/`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setUserData({
              username: data.username || "Kullanıcı",
              email: data.email || "",
              profile_picture: data.profile_picture || null
            });
            try {
              const stored = JSON.parse(localStorage.getItem("user") || "{}");
              localStorage.setItem(
                "user",
                JSON.stringify({
                  ...stored,
                  username: data.username,
                  email: data.email,
                  phone_number: data.phone_number,
                  profile_picture: data.profile_picture
                })
              );
              localStorage.setItem("username", data.username);
            } catch {}
          }
        })
        .catch(() => {});
    }

    // Profil güncellendiğinde hemen UserMenu'yu güncelle
    const handleUserUpdate = () => loadUserData();
    window.addEventListener("user-updated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);

    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, [token]);

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

  // logout
  const handleLogout = () => {
    localStorage.clear();
    setIsOpen(false);
    navigate("/login");
  };

  // if not login show the login page
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

  const avatarUrl = formatImgUrl(userData.profile_picture);

  // if login show avatar, username
  return (
    <div className="flex items-center gap-2.5">
      <AlarmDropdown />
      <NotificationBell />
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-xl border border-[#232E3D] bg-[#161F2B] px-3 py-1.5 text-sm font-medium text-[#EDEFF2] hover:border-[#E8A33D]/50 hover:bg-[#1C2733] transition-all shadow-sm"
        >
          {/* Avatar / Profil Resmi */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8A33D] text-xs font-bold text-[#0F1720] overflow-hidden border border-[#232E3D] shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userData.username}
                className="w-full h-full object-cover"
              />
            ) : (
              userData.username ? userData.username[0].toUpperCase() : <User size={14} />
            )}
          </div>

          {/* Kullanıcı Adı */}
          <span className="max-w-[120px] truncate text-xs sm:text-sm font-medium">
            {userData.username}
          </span>

          {/* Açılır Ok */}
          <ChevronDown
            size={16}
            className={`text-[#8B95A3] transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#E8A33D]" : ""
            }`}
          />
        </button>

        {/* Açılır Menü (Dropdown) */}
        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-[#232E3D] bg-[#161F2B] p-2 shadow-2xl shadow-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100">
            {/* Kullanıcı Bilgi Başlığı */}
            <div className="flex items-center gap-3 px-2.5 py-2 border-b border-[#232E3D] mb-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8A33D] text-xs font-bold text-[#0F1720] overflow-hidden border border-[#232E3D] shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userData.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userData.username ? userData.username[0].toUpperCase() : <User size={16} />
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[#EDEFF2] truncate">
                  {userData.username}
                </p>
                {userData.email && (
                  <p className="text-[11px] text-[#8B95A3] truncate">
                    {userData.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              {/* Profilim */}
              <Link
                to="/profilim"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#EDEFF2] hover:bg-[#1C2733] hover:text-[#E8A33D] transition-colors"
              >
                <User size={16} className="text-[#E8A33D]" />
                Profilim
              </Link>

              {/* Favorilerim */}
              <Link
                to="/favorilerim"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#EDEFF2] hover:bg-[#1C2733] hover:text-[#E8A33D] transition-colors"
              >
                <Heart size={16} className="text-[#E8A33D]" />
                Favorilerim
              </Link>

              {/* Takip Ettiklerim */}
              <Link
                to="/takip-ettiklerim"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#EDEFF2] hover:bg-[#1C2733] hover:text-[#E8A33D] transition-colors"
              >
                <UserCheck size={16} className="text-[#10B981]" />
                Takip Ettiklerim
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
