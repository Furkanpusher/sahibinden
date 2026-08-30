import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Loader2,
  Save,
  CheckCircle,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import UserMenu from "../../components/UserMenu";
import { authFetch, formatApiError } from "../../api";

const BACKEND_BASE = "http://127.0.0.1:8001";
const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8001/api";

const formatImgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form State
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone_number: "",
    profile_picture: null,
    date_joined: ""
  });

  const [initialData, setInitialData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("access_token") || localStorage.getItem("access");

  // Profil Verilerini Çek
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    authFetch(`${API_URL}/accounts/my-profile/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Profil bilgileri alınamadı.");
        }
        return res.json();
      })
      .then((data) => {
        setProfileData({
          username: data.username || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          profile_picture: data.profile_picture || null,
          date_joined: data.date_joined || ""
        });
        setInitialData(data);

        // LocalStorage'ı da senkronize et
        try {
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const updatedUser = {
            ...storedUser,
            id: data.id || storedUser.id,
            username: data.username,
            email: data.email,
            phone_number: data.phone_number,
            profile_picture: data.profile_picture
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          if (data.id) localStorage.setItem("user_id", String(data.id));
          localStorage.setItem("username", data.username);
          window.dispatchEvent(new Event("user-updated"));
        } catch (err) {
          console.error("LocalStorage güncellenemedi:", err);
        }
      })
      .catch((err) => {
        if (err.isSessionExpired) return;
        setError(err.message || "Profil yüklenirken hata oluştu.");
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  // Fotoğraf Seçildiğinde
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB Limit kontrolü
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profil fotoğrafı en fazla 5MB olabilir.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
  };

  // Form Gönderimi (Güncelleme)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("username", profileData.username.trim());
      formData.append("email", profileData.email.trim());
      formData.append("phone_number", profileData.phone_number.trim());

      if (selectedFile) {
        formData.append("profile_picture", selectedFile);
      }

      const response = await authFetch(`${API_URL}/accounts/my-profile/`, {
        method: "PATCH",
        body: formData
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(formatApiError(resData) || "Profil güncellenemedi.");
      }

      // Başarılı Güncelleme
      toast.success("Profil bilgileriniz başarıyla güncellendi.");
      setInitialData(resData);
      setProfileData({
        username: resData.username || "",
        email: resData.email || "",
        phone_number: resData.phone_number || "",
        profile_picture: resData.profile_picture || null,
        date_joined: resData.date_joined || ""
      });
      setSelectedFile(null);

      // LocalStorage'ı senkronize et (navbar ve menü için)
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...storedUser,
          id: resData.id || storedUser.id,
          username: resData.username,
          email: resData.email,
          phone_number: resData.phone_number,
          profile_picture: resData.profile_picture
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        if (resData.id) localStorage.setItem("user_id", String(resData.id));
        localStorage.setItem("username", resData.username);
        window.dispatchEvent(new Event("user-updated"));
      } catch (err) {
        console.error("LocalStorage güncellenemedi:", err);
      }
    } catch (err) {
      if (err.isSessionExpired) return;
      toast.error(err.message || "Güncelleme sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // Değişiklikleri Sıfırla
  const handleReset = () => {
    if (initialData) {
      setProfileData({
        username: initialData.username || "",
        email: initialData.email || "",
        phone_number: initialData.phone_number || "",
        profile_picture: initialData.profile_picture || null,
        date_joined: initialData.date_joined || ""
      });
      setSelectedFile(null);
      setPreviewImage(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Belirtilmemiş";
    try {
      return new Date(dateStr).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Avatar URL (Önizleme veya Server URL)
  const currentAvatarSrc = previewImage || formatImgUrl(profileData.profile_picture);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1720] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1720] text-[#EDEFF2] px-4 py-5 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Üst Navigasyon & Başlık */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#8B95A3] transition-colors hover:text-[#EDEFF2]"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Ana Sayfaya Dön
          </Link>
          <UserMenu />
        </div>

        {/* Başlık Alanı */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#EDEFF2]">
            Profil Bilgilerim
          </h1>
          <p className="text-sm text-[#8B95A3] mt-1">
            Hesap detaylarınızı, profil fotoğrafınızı ve iletişim bilgilerinizi güncelleyin.
          </p>
        </div>

        {/* Hata Bildirimi */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Profil Form Kartı */}
        <div className="rounded-2xl border border-[#232E3D] bg-[#161F2B] p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fotoğraf Yükleme Bölümü */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#232E3D]">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#E8A33D]/50 bg-[#0F1720] flex items-center justify-center shadow-inner">
                  {currentAvatarSrc ? (
                    <img
                      src={currentAvatarSrc}
                      alt="Profil Fotoğrafı"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-bold text-[#E8A33D]">
                      {profileData.username?.[0]?.toUpperCase() || <User size={36} />}
                    </span>
                  )}
                </div>

                {/* Kamera İkonlu Seçici Buton */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Fotoğraf Yükle"
                  className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#E8A33D] text-[#0F1720] hover:bg-[#F0B058] transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  <Camera size={16} />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-base font-semibold text-[#EDEFF2]">
                  Profil Fotoğrafı
                </h3>
                <p className="text-xs text-[#8B95A3]">
                  JPG, PNG veya WebP formatında, en fazla 5MB boyutunda bir fotoğraf seçebilirsiniz.
                </p>
                {selectedFile && (
                  <p className="text-xs text-[#E8A33D] font-medium pt-1">
                    Yeni görsel seçildi: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Form Alanları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Kullanıcı Adı */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B95A3]">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8B95A3]">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={profileData.username}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, username: e.target.value }))
                    }
                    placeholder="Kullanıcı adınız"
                    className="w-full rounded-xl border border-[#232E3D] bg-[#0F1720] pl-10 pr-4 py-2.5 text-sm text-[#EDEFF2] placeholder-[#8B95A3]/50 focus:border-[#E8A33D] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* E-posta */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B95A3]">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8B95A3]">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="ornek@email.com"
                    className="w-full rounded-xl border border-[#232E3D] bg-[#0F1720] pl-10 pr-4 py-2.5 text-sm text-[#EDEFF2] placeholder-[#8B95A3]/50 focus:border-[#E8A33D] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Telefon Numarası */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B95A3]">
                  Telefon Numarası
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8B95A3]">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, phone_number: e.target.value }))
                    }
                    placeholder="05XX XXX XX XX"
                    className="w-full rounded-xl border border-[#232E3D] bg-[#0F1720] pl-10 pr-4 py-2.5 text-sm text-[#EDEFF2] placeholder-[#8B95A3]/50 focus:border-[#E8A33D] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Kayıt Tarihi (Read-Only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B95A3]">
                  Kayıt Tarihi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8B95A3]">
                    <Calendar size={16} />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={formatDate(profileData.date_joined)}
                    className="w-full rounded-xl border border-[#232E3D] bg-[#161F2B] pl-10 pr-4 py-2.5 text-sm text-[#8B95A3] cursor-not-allowed opacity-80"
                  />
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#232E3D]">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="w-full sm:w-auto rounded-xl border border-[#232E3D] px-5 py-2.5 text-xs font-medium text-[#8B95A3] hover:bg-[#232E3D] hover:text-[#EDEFF2] transition-colors disabled:opacity-50"
              >
                Sıfırla
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#E8A33D] hover:bg-[#F0B058] px-6 py-2.5 text-xs font-bold text-[#0F1720] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
