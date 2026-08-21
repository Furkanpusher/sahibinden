import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Car, Loader2, Upload, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { postListing, uploadListingImages } from "../../api";
import { getCities, getDistricts, getCarBrands, getCarModels } from "../../data/helper";

const TRANSMISSION_OPTIONS = ["Düz", "Otomatik", "Yarı Otomatik"];
const FUEL_OPTIONS = ["Benzin", "Dizel", "LPG", "Elektrik", "Hibrit"];
const BODY_OPTIONS = ["Sedan", "Hatchback", "SUV", "Pickup", "Minivan", "Coupe", "Cabrio"];

export default function CreateCarPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 📸 Fotoğraf State'leri
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

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

    // Boş string alanları null yap, car_status → status olarak gönder
    const { car_status, ...rest } = form;
    const payload = Object.fromEntries(
      Object.entries({ ...rest, status: car_status }).map(([k, v]) => [k, v === "" ? null : v])
    );

    try {
      // 1. İlanı oluştur
      const createdCar = await postListing("/cars/", payload);

      // 2. Fotoğraflar varsa ilana yükle
      if (selectedFiles.length > 0 && createdCar?.id) {
        await uploadListingImages(createdCar.id, selectedFiles);
      }

      toast.success("İlan ve fotoğraflar başarıyla yüklendi!");
      setTimeout(() => navigate("/cars"), 1200);
    } catch (err) {
      toast.error(err.message || "İlan oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/cars" className="group mb-6 inline-flex items-center gap-1.5 text-sm text-[#8B95A3] hover:text-[#EDEFF2] transition-colors">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Araç İlanları
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8A33D]/10">
            <Car size={20} className="text-[#E8A33D]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#EDEFF2]">Araç İlanı Oluştur</h1>
            <p className="text-sm text-[#667384]">Aracının bilgilerini eksiksiz doldur</p>
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
                  placeholder="Örn: Polo, 3 Serisi..."
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
                      {t === "Düz" ? "Düz (Manuel)" : t}
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
