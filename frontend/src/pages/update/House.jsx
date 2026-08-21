import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchListings, formatApiError } from "../../api";

const ROOM_OPTIONS = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "Dupleks"];
const BUILDING_AGE_OPTIONS = ["0 (Yeni)", "1-5", "6-10", "11-15", "16-20", "21 ve üzeri"];
const FLOOR_OPTIONS = ["Kot 1", "Giriş Katı", "Bahçe Katı", "1. Kat", "2. Kat", "3. Kat", "4. Kat", "En Üst Kat", "Müstakil"];

export default function HouseUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [initialForm, setInitialForm] = useState(null);
  const [form, setForm] = useState({
    title: "", price: "", city: "", district: "",
    number_of_rooms: "", meter_squared: "", building_aged: "",
    floor: "", number_of_floors: "", credit_eligibility: false,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchListings(`/houses/${id}/`)
      .then((data) => {
        if (!data) return;
        const initialData = {
          title: data.title || "",
          price: data.price !== null && data.price !== undefined ? String(data.price) : "",
          city: data.city || "",
          district: data.district || "",
          number_of_rooms: data.number_of_rooms || "",
          meter_squared: data.meter_squared !== null && data.meter_squared !== undefined ? String(data.meter_squared) : "",
          building_aged: data.building_aged || "",
          floor: data.floor || "",
          number_of_floors: data.number_of_floors !== null && data.number_of_floors !== undefined ? String(data.number_of_floors) : "",
          credit_eligibility: Boolean(data.credit_eligibility),
        };
        setForm(initialData);
        setInitialForm(initialData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sadece değişen alanları tespit et (Partial update)
    const changedPayload = {};
    if (initialForm) {
      Object.keys(form).forEach((key) => {
        if (form[key] !== initialForm[key]) {
          const val = form[key];
          changedPayload[key] = val === "" ? null : val;
        }
      });
    }

    // Hiçbir alan değişmediyse gereksiz istek gönderme
    if (Object.keys(changedPayload).length === 0) {
      toast.info("Herhangi bir değişiklik yapılmadı.");
      navigate(`/houses/${id}`);
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("access") || localStorage.getItem("token") || localStorage.getItem("access_token");
      const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8001/api";

      const response = await fetch(`${API_URL}/listings/houses/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(changedPayload),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(formatApiError(resData));
      }

      toast.success("Ev ilanı başarıyla güncellendi!");
      setTimeout(() => navigate(`/houses/${id}`), 1200);
    } catch (err) {
      toast.error(err.message || "Güncelleme sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1720] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1720] flex flex-col items-center justify-center text-[#8B95A3]">
        <p className="mb-4">İlan yüklenemedi: {error}</p>
        <Link to="/houses" className="text-[#E8A33D] text-sm hover:underline">
          Ev listesine dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link to={`/houses/${id}`} className="group mb-6 inline-flex items-center gap-1.5 text-sm text-[#8B95A3] hover:text-[#EDEFF2] transition-colors">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          İlan Detayına Dön
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8A33D]/10">
            <Home size={20} className="text-[#E8A33D]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#EDEFF2]">Ev İlanını Düzenle</h1>
            <p className="text-sm text-[#667384]">İlan bilgilerini güncelleyin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Temel Bilgiler">
            <Field label="İlan Başlığı *">
              <input type="text" placeholder="Kadıköy Moda 3+1 Daire" value={form.title} onChange={handleChange("title")} required />
            </Field>
            <Field label="Fiyat (₺) *">
              <input type="number" placeholder="4500000" value={form.price} onChange={handleChange("price")} required />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Şehir"><input placeholder="İstanbul" value={form.city} onChange={handleChange("city")} /></Field>
              <Field label="İlçe"><input placeholder="Kadıköy" value={form.district} onChange={handleChange("district")} /></Field>
            </div>
          </Section>

          <Section title="Ev Detayları">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Oda Sayısı">
                <select value={form.number_of_rooms} onChange={handleChange("number_of_rooms")}>
                  <option value="">Seçiniz</option>
                  {ROOM_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Metrekare (m²)">
                <input type="number" placeholder="125" value={form.meter_squared} onChange={handleChange("meter_squared")} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Bina Yaşı">
                <select value={form.building_aged} onChange={handleChange("building_aged")}>
                  <option value="">Seçiniz</option>
                  {BUILDING_AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Bulunduğu Kat">
                <select value={form.floor} onChange={handleChange("floor")}>
                  <option value="">Seçiniz</option>
                  {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Toplam Kat Sayısı">
                <input type="number" placeholder="5" value={form.number_of_floors} onChange={handleChange("number_of_floors")} />
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2 select-none pt-2">
              <input type="checkbox" checked={form.credit_eligibility} onChange={handleChange("credit_eligibility")} className="h-4 w-4 accent-[#E8A33D]" />
              <span className="text-sm text-[#8B95A3]">Krediye Uygun</span>
            </label>
          </Section>

          <button type="submit" disabled={saving}
            className="w-full rounded-lg bg-[#E8A33D] py-3 text-sm font-semibold text-[#0F1720] transition-colors hover:bg-[#F0B058] disabled:opacity-50">
            {saving
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Kaydediliyor...</span>
              : "Güncellemeleri Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-[#232E3D] bg-[#161F2B] p-5">
      <h2 className="mb-4 border-b border-[#232E3D] pb-3 text-sm font-semibold text-[#EDEFF2]">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#8B95A3]">{label}</span>
      <div className="
        [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-[#232E3D]
        [&>input]:bg-[#0F1720] [&>input]:px-3 [&>input]:py-2.5 [&>input]:text-sm
        [&>input]:text-[#EDEFF2] [&>input]:placeholder-[#4A5568] [&>input]:outline-none
        [&>input]:focus:border-[#E8A33D] [&>input]:transition-colors
        [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-[#232E3D]
        [&>select]:bg-[#0F1720] [&>select]:px-3 [&>select]:py-2.5 [&>select]:text-sm
        [&>select]:text-[#EDEFF2] [&>select]:outline-none [&>select]:focus:border-[#E8A33D]
      ">
        {children}
      </div>
    </label>
  );
}
