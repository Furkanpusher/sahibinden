import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { postListing, uploadListingImages } from "../../api";
import { getCities, getDistricts } from "../../data/helper";

const ROOM_OPTIONS = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "Dupleks"];
const BUILDING_AGE_OPTIONS = ["0 (Yeni)", "1-5", "6-10", "11-15", "16-20", "21 ve üzeri"];
const FLOOR_OPTIONS = ["Kot 1", "Giriş Katı", "Bahçe Katı", "1. Kat", "2. Kat", "3. Kat", "4. Kat", "En Üst Kat", "Müstakil"];

export default function CreateHousePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 📸 Fotoğraf State'leri
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [form, setForm] = useState({
    title: "",
    price: "",
    city: "",
    district: "",
    number_of_rooms: "",
    meter_squared: "",
    building_aged: "",
    floor: "",
    number_of_floors: "",
    credit_eligibility: false,
  });

  // 🔹 Dropdown Verilerini Hazırla
  const cities = useMemo(() => getCities(), []);
  const districts = useMemo(() => getDistricts(form.city), [form.city]);

  const handleChange = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    
    setForm((prev) => ({
      ...prev,
      [field]: val,
      // Şehir değişirse seçili ilçeyi sıfırla
      ...(field === "city" ? { district: "" } : {}),
    }));
  };

  // 📸 Fotoğraf Seçme İşlemi
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  // 📸 Seçilen Fotoğrafı Kaldırma
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
    );

    try {
      // 1. Ev İlanını oluştur
      const createdHouse = await postListing("/all-houses/", payload);

      // 2. Seçilen fotoğrafları ilana yükle
      if (selectedFiles.length > 0 && createdHouse?.id) {
        await uploadListingImages(createdHouse.id, selectedFiles);
      }

      toast.success("Ev ilanı ve fotoğraflar başarıyla yüklendi!");
      setTimeout(() => navigate("/all-houses"), 1200);
    } catch (err) {
      toast.error(err.message || "Ev ilanı oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/all-houses" className="group mb-6 inline-flex items-center gap-1.5 text-sm text-[#8B95A3] hover:text-[#EDEFF2] transition-colors">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Ev İlanları
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8A33D]/10">
            <Home size={20} className="text-[#E8A33D]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#EDEFF2]">Ev İlanı Oluştur</h1>
            <p className="text-sm text-[#667384]">Evinin bilgilerini eksiksiz doldur</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 📸 FOTOĞRAF YÜKLEME BÖLÜMÜ */}
          <Section title="Fotoğraflar">
            <div>
              <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#232E3D] bg-[#0F1720] p-6 hover:border-[#E8A33D] transition-colors cursor-pointer">
                <Upload size={28} className="text-[#E8A33D] mb-2" />
                <span className="text-sm font-medium text-[#EDEFF2]">Fotoğraf Yükle</span>
                <span className="text-xs text-[#667384] mt-1">Birden fazla görsel seçebilirsiniz (JPG, PNG, WEBP)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Seçilen Fotoğrafların Önizlemesi */}
              {previewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#232E3D] aspect-square bg-[#0F1720]">
                      <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 rounded-full bg-[#0F1720]/80 p-1 text-[#E88080] hover:bg-[#E88080] hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-[#E8A33D] px-1.5 py-0.5 text-[10px] font-bold text-[#0F1720]">
                          Kapak
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section title="Temel Bilgiler">
            <Field label="İlan Başlığı *">
              <input
                type="text"
                placeholder="Kadıköy Moda 3+1 Deniz Manzaralı Daire"
                value={form.title}
                onChange={handleChange("title")}
                required
              />
            </Field>

            <Field label="Fiyat (₺) *">
              <input
                type="number"
                placeholder="4500000"
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

          <Section title="Ev Detayları">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Oda Sayısı">
                <select value={form.number_of_rooms} onChange={handleChange("number_of_rooms")}>
                  <option value="">Seçiniz</option>
                  {ROOM_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              <Field label="Metrekare (m²)">
                <input
                  type="number"
                  placeholder="125"
                  value={form.meter_squared}
                  onChange={handleChange("meter_squared")}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Bina Yaşı">
                <select value={form.building_aged} onChange={handleChange("building_aged")}>
                  <option value="">Seçiniz</option>
                  {BUILDING_AGE_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </Field>

              <Field label="Bulunduğu Kat">
                <select value={form.floor} onChange={handleChange("floor")}>
                  <option value="">Seçiniz</option>
                  {FLOOR_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </Field>

              <Field label="Toplam Kat Sayısı">
                <input
                  type="number"
                  placeholder="5"
                  value={form.number_of_floors}
                  onChange={handleChange("number_of_floors")}
                />
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2 select-none pt-2">
              <input
                type="checkbox"
                checked={form.credit_eligibility}
                onChange={handleChange("credit_eligibility")}
                className="h-4 w-4 accent-[#E8A33D]"
              />
              <span className="text-sm text-[#8B95A3]">Krediye Uygun</span>
            </label>
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#E8A33D] py-3 text-sm font-semibold text-[#0F1720] transition-colors hover:bg-[#F0B058] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Gönderiliyor...
              </span>
            ) : (
              "İlanı Yayınla"
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
