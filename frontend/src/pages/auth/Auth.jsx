import { useState } from "react";
import { User, Lock, Mail, Phone, LogIn, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8001/accounts";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    phone_number: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const endpoint = mode === "login" ? "/login/" : "/register/";
    const payload =
      mode === "login"
        ? { username: form.username, password: form.password }
        : form;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        if (mode === "login") {
          // when logined succesfully, write this data to localStorage
          // this data will be used in axios interceptors or other functions
          const token = data.access || data.access_token;
          localStorage.setItem("access_token", token);
          localStorage.setItem("access", token);
          localStorage.setItem("refresh_token", data.refresh || data.refresh_token);

          if (data.user_id) localStorage.setItem("user_id", String(data.user_id));
          if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

          const isStaff = Boolean(data.is_staff || data.user?.is_staff);
          localStorage.setItem("is_staff", String(isStaff));

          setStatus({
            type: "success",
            message: "Giriş başarılı, yönlendiriliyorsun...",
            detail: token,
          });

          setTimeout(() => navigate("/"), 600);
        } else {
          setStatus({
            type: "success",
            message: "Kayıt başarılı, şimdi giriş yapabilirsin.",
          });
          setMode("login");
        }
      } else {
        const ilkHata =
          typeof data === "object"
            ? Object.values(data).flat()[0]
            : "Bir hata oluştu.";
        setStatus({ type: "error", message: String(ilkHata) });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Sunucuya bağlanılamadı. Django çalışıyor mu?",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F1720] p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-[#E8A33D] flex items-center justify-center font-bold text-[#0F1720] text-sm">
              İ
            </div>
            <span className="text-[#EDEFF2] font-semibold tracking-tight text-lg">
              İlanPazarı
            </span>
          </div>
          <p className="text-[#8B95A3] text-sm">Ev ve araç ilanları platformu</p>
        </div>

        <div className="bg-[#161F2B] border border-[#232E3D] rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex border-b border-[#232E3D]">
            <button
              onClick={() => {
                setMode("login");
                setStatus(null);
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === "login"
                ? "text-[#E8A33D] bg-[#1C2733]"
                : "text-[#8B95A3] hover:text-[#EDEFF2]"
                }`}
            >
              <LogIn size={16} /> Giriş Yap
            </button>
            <button
              onClick={() => {
                setMode("register");
                setStatus(null);
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === "register"
                ? "text-[#E8A33D] bg-[#1C2733]"
                : "text-[#8B95A3] hover:text-[#EDEFF2]"
                }`}
            >
              <UserPlus size={16} /> Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field
              icon={<User size={16} />}
              label="Kullanıcı adı"
              value={form.username}
              onChange={handleChange("username")}
              placeholder="furkan"
              required
            />

            {mode === "register" && (
              <>
                <Field
                  icon={<Mail size={16} />}
                  label="E-posta"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="furkan@example.com"
                  required
                />
                <Field
                  icon={<Phone size={16} />}
                  label="Telefon"
                  value={form.phone_number}
                  onChange={handleChange("phone_number")}
                  placeholder="05xx xxx xx xx"
                />
              </>
            )}

            <Field
              icon={<Lock size={16} />}
              label="Şifre"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="En az 8 karakter"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-lg bg-[#E8A33D] text-[#0F1720] font-semibold text-sm hover:bg-[#F0B058] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Gönderiliyor..."
                : mode === "login"
                  ? "Giriş Yap"
                  : "Kayıt Ol"}
            </button>

            {status && (
              <div
                className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${status.type === "success"
                  ? "bg-[#1B3A2E] text-[#6FCF97] border border-[#2B5240]"
                  : "bg-[#3A1B1B] text-[#E88080] border border-[#522B2B]"
                  }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0" />
                )}
                <div className="break-words">
                  <div>{status.message}</div>
                </div>
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}

function Field({ icon, label, type = "text", value, onChange, placeholder, required }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#8B95A3] mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2 bg-[#0F1720] border border-[#232E3D] rounded-lg px-3 focus-within:border-[#E8A33D] transition-colors">
        <span className="text-[#4A5568]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent py-2.5 text-sm text-[#EDEFF2] placeholder-[#4A5568] outline-none"
        />
      </div>
    </label>
  );
}
