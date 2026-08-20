import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Car, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchListings, formatApiError } from "../../api";
import { getCities, getDistricts, getCarBrands, getCarModels } from "../../data/helper";

const TRANSMISSION_OPTIONS = ["manuel", "otomatik", "yarı otomatik"];
const FUEL_OPTIONS = ["Benzin", "Dizel", "LPG", "Elektrik", "Hibrit"];
const BODY_OPTIONS = ["Sedan", "Hatchback", "SUV", "Pickup", "Minivan", "Coupe", "Cabrio"];

export default function CarUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [initialForm, setInitialForm] = useState(null);
  const [form, setForm] = useState({
    title: "", city: "", district: "", price: "",
    brand: "", series: "", model: "", year: "", km: "",
    transmission_type: "", fuel_type: "", body_type: "", color: "",
    engine_size: "", engine_power: "", traction: "", car_status: "",
    avg_fuel_consumption: "", fuel_tank: "", changed_parts: "",
    from_whom: "", tramer: "", for_trade: false,
  });

  // 🔹 Dropdown Verilerini Hazırla
  const cities = useMemo(() => getCities(), []);
  const districts = useMemo(() => getDistricts(form.city), [form.city]);
  const carBrands = useMemo(() => getCarBrands(), []);
  const carModels = useMemo(() => getCarModels(form.brand), [form.brand]);

  // Mevcut ilan verilerini çekip formu dolduruyoruz
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchListings(`/car/${id}/`)
      .then((data) => {
        if (!data) return;
        const initialData = {
          title: data.title || "",
          city: data.city || "",
          district: data.district || "",
          price: data.price !== null && data.price !== undefined ? String(data.price) : "",
          brand: data.brand || "",
          series: data.series || "",
          model: data.model || "",
          year: data.year !== null && data.year !== undefined ? String(data.year) : "",
          km: data.km !== null && data.km !== undefined ? String(data.km) : "",
          transmission_type: data.transmission_type || "",
          fuel_type: data.fuel_type || "",
          body_type: data.body_type || "",
          color: data.color || "",
          engine_size: data.engine_size || "",
          engine_power: data.engine_power || "",
          traction: data.traction || "",
          car_status: data.status || "",
          avg_fuel_consumption: data.avg_fuel_consumption || "",
          fuel_tank: data.fuel_tank || "",
          changed_parts: data.changed_parts || "",
          from_whom: data.from_whom || "",
          tramer: data.tramer !== null && data.tramer !== undefined ? String(data.tramer) : "",
          for_trade: Boolean(data.for_trade),
        };
        setForm(initialData);
        setInitialForm(initialData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: val,
      // Şehir değişirse seçili ilçeyi sıfırla
      ...(field === "city" ? { district: "" } : {}),
      // Marka değişirse seçili modeli sıfırla
      ...(field === "brand" ? { model: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sadece değişen alanları tespit et (Partial update)
    const changedPayload = {};
    if (initialForm) {
      Object.keys(form).forEach((key) => {
        if (form[key] !== initialForm[key]) {
          const backendKey = key === "car_status" ? "status" : key;
          const val = form[key];
          changedPayload[backendKey] = val === "" ? null : val;
        }
      });
    }

    // Hiçbir alan değişmediyse gereksiz istek gönderme
    if (Object.keys(changedPayload).length === 0) {
      toast.info("Herhangi bir değişiklik yapılmadı.");
      navigate(`/car/${id}`);
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("access") || localStorage.getItem("token") || localStorage.getItem("access_token");
      const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8001/api";

      const response = await fetch(`${API_URL}/listings/car/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(changedPayload),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(formatApiError(resData));
      }

      toast.success("İlan başarıyla güncellendi!");
      setTimeout(() => navigate(`/car/${id}`), 1200);
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
        <p className="mb-4">İlan bilgileri yüklenemedi: {error}</p>
        <Link to="/all-cars" className="text-[#E8A33D] text-sm hover:underline">
          Araç listesine dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link to={`/car/${id}`} className="group mb-6 inline-flex items-center gap-1.5 text-sm text-[#8B95A3] hover:text-[#EDEFF2] transition-colors">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          İlan Detayına Dön
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8A33D]/10">
            <Car size={20} className="text-[#E8A33D]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#EDEFF2]">Araç İlanını Düzenle</h1>
            <p className="text-sm text-[#667384]">İlan bilgilerini güncelleyin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Temel Bilgiler">
            <Field label="İlan Başlığı *">
              <input
                type="text"
                placeholder="2020 VW Polo 1.0 TSI"
                value={form.title}
                onChange={handleChange("title")}
                required
              />
            </Field>

            <Field label="Fiyat (₺) *">
              <input
                type="number"
                placeholder="850000"
                value={form.price}
                onChange={handleChange("price")}
                required
              />
            </Field>

            {/* 🏙️ ŞEHİR & İLÇE DROPDOWNLARI */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Şehir *">
                <select value={form.city} onChange={handleChange("city")} required>
                  <option value="">Şehir Seçiniz</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="İlçe *">
                <select
                  value={form.district}
                  onChange={handleChange("district")}
                  disabled={!form.city}
                  required
                >
                  <option value="">
                    {form.city ? "İlçe Seçiniz" : "Önce Şehir Seçiniz"}
                  </option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Araç Bilgileri">
            {/* 🚗 MARKA & SERİ */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Marka *">
                <select value={form.brand} onChange={handleChange("brand")} required>
                  <option value="">Marka Seçiniz</option>
                  {carBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Seri">
                <input
                  placeholder="Polo, 3 Serisi..."
                  value={form.series}
                  onChange={handleChange("series")}
                />
              </Field>
            </div>

            {/* 🚘 MODEL & YIL */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Model *">
                <select
                  value={form.model}
                  onChange={handleChange("model")}
                  disabled={!form.brand}
                  required
                >
                  <option value="">
                    {form.brand ? "Model Seçiniz" : "Önce Marka Seçiniz"}
                  </option>
                  {carModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Yıl">
                <input
                  type="number"
                  placeholder="2020"
                  value={form.year}
                  onChange={handleChange("year")}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Kilometre">
                <input
                  type="number"
                  placeholder="45000"
                  value={form.km}
                  onChange={handleChange("km")}
                />
              </Field>
              <Field label="Renk">
                <input
                  placeholder="Beyaz"
                  value={form.color}
                  onChange={handleChange("color")}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Vites">
                <select value={form.transmission_type} onChange={handleChange("transmission_type")}>
                  <option value="">Seçiniz</option>
                  {TRANSMISSION_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Yakıt">
                <select value={form.fuel_type} onChange={handleChange("fuel_type")}>
                  <option value="">Seçiniz</option>
                  {FUEL_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </Field>

              <Field label="Kasa">
                <select value={form.body_type} onChange={handleChange("body_type")}>
                  <option value="">Seçiniz</option>
                  {BODY_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Teknik Detaylar">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Motor Hacmi"><input placeholder="1.0" value={form.engine_size} onChange={handleChange("engine_size")} /></Field>
              <Field label="Motor Gücü (HP)"><input placeholder="110" value={form.engine_power} onChange={handleChange("engine_power")} /></Field>
              <Field label="Çekiş"><input placeholder="Önden çekiş" value={form.traction} onChange={handleChange("traction")} /></Field>
              <Field label="Araç Durumu"><input placeholder="İkinci el" value={form.car_status} onChange={handleChange("car_status")} /></Field>
              <Field label="Ort. Yakıt (L/100km)"><input placeholder="5.4" value={form.avg_fuel_consumption} onChange={handleChange("avg_fuel_consumption")} /></Field>
              <Field label="Yakıt Deposu (L)"><input placeholder="40" value={form.fuel_tank} onChange={handleChange("fuel_tank")} /></Field>
            </div>

            <Field label="Değişen Parçalar">
              <input placeholder="Ön tampon, sağ ön kapı" value={form.changed_parts} onChange={handleChange("changed_parts")} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tramer (₺)"><input type="number" placeholder="0" value={form.tramer} onChange={handleChange("tramer")} /></Field>
              <Field label="Kimden"><input placeholder="Galeriden / Sahibinden" value={form.from_whom} onChange={handleChange("from_whom")} /></Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input type="checkbox" checked={form.for_trade} onChange={handleChange("for_trade")} className="h-4 w-4 accent-[#E8A33D]" />
              <span className="text-sm text-[#8B95A3]">Takasa uygun</span>
            </label>
          </Section>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#E8A33D] py-3 text-sm font-semibold text-[#0F1720] transition-colors hover:bg-[#F0B058] disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Kaydediliyor...
              </span>
            ) : (
              "Güncellemeleri Kaydet"
            )}
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
        [&>select]:disabled:opacity-50 [&>select]:disabled:cursor-not-allowed
      ">
        {children}
      </div>
    </label>
  );
}
