import { useState, useEffect } from "react";
import {
  X,
  Radio,
  Search,
  Tag,
  FileEdit,
  Car,
  Home,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingDown
} from "lucide-react";
import { toast } from "sonner";
import { createAlarm, formatApiError, fetchListings } from "../api";
import { getCarBrands } from "../data/helper";

const ROOM_OPTIONS = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "Dupleks"];
const TRANSMISSIONS = [
  { label: "Manuel", value: "manuel" },
  { label: "Otomatik", value: "otomatik" },
  { label: "Yarı Otomatik", value: "yarı otomatik" },
];

const FLOOR_OPTIONS = [
  "Bahçe Katı",
  "Giriş Katı",
  "Yüksek Giriş",
  "1",
  "2",
  "3",
  "4",
  "5",
  "Ara Kat",
  "En Üst Kat",
  "Çatı Katı",
  "Villa Tipi",
];

export default function CreateAlarmModal({
  isOpen,
  onClose,
  initialCategory = "car",
  initialFilters = {},
  initialListing = null,
  initialAlarmType = "new_listing_check",
  onAlarmCreated,
}) {
  const [alarmType, setAlarmType] = useState(initialAlarmType);
  const [category, setCategory] = useState(initialCategory);

  // Kriter Formu State'leri (new_listing_check)
  const [formData, setFormData] = useState({
    min_price: "",
    max_price: "",
    brands: [],
    transmission_types: [],
    max_km: "",
    number_of_rooms: [],
    min_meter_squared: "",
    floor: [],
  });

  // İlan Bazlı State'ler (price_change & favorite_updated)
  const [listingIdInput, setListingIdInput] = useState(
    initialListing?.id ? String(initialListing.id) : ""
  );
  const [targetListing, setTargetListing] = useState(initialListing);
  const [searchingListing, setSearchingListing] = useState(false);

  const [loading, setLoading] = useState(false);
  const carBrands = getCarBrands();

  // Modal açıldığında başlangıç durumunu ayarla
  useEffect(() => {
    if (isOpen) {
      setAlarmType(initialAlarmType || "new_listing_check");
      setCategory(initialCategory || "car");

      if (initialListing) {
        setTargetListing(initialListing);
        setListingIdInput(String(initialListing.id));
      } else {
        setTargetListing(null);
        setListingIdInput("");
      }

      // Filtreleri doldur
      setFormData({
        min_price: initialFilters?.price_min || initialFilters?.min_price || "",
        max_price: initialFilters?.price_max || initialFilters?.max_price || "",
        brands: initialFilters?.brand
          ? [initialFilters.brand]
          : initialFilters?.brands || [],
        transmission_types: initialFilters?.transmission_type
          ? [initialFilters.transmission_type]
          : initialFilters?.transmission_types || [],
        max_km: initialFilters?.max_km || "",
        number_of_rooms: initialFilters?.number_of_rooms
          ? Array.isArray(initialFilters.number_of_rooms)
            ? initialFilters.number_of_rooms
            : [initialFilters.number_of_rooms]
          : [],
        min_meter_squared:
          initialFilters?.min_meter_squared || initialFilters?.meter_squared || "",
        floor: initialFilters?.floor
          ? Array.isArray(initialFilters.floor)
            ? initialFilters.floor
            : [initialFilters.floor]
          : [],
      });
    }
  }, [isOpen]);

  // Manuel İlan ID arama
  const handleSearchListing = async () => {
    if (!listingIdInput) return;
    try {
      setSearchingListing(true);
      // Önce araçlarda ara
      try {
        const carData = await fetchListings(`/cars/${listingIdInput}/`);
        if (carData && carData.id) {
          setTargetListing(carData);
          return;
        }
      } catch (e) {
        // Araçta bulunamadıysa evlerde dene
      }

      const houseData = await fetchListings(`/houses/${listingIdInput}/`);
      if (houseData && houseData.id) {
        setTargetListing(houseData);
      } else {
        toast.error("İlan bulunamadı.");
        setTargetListing(null);
      }
    } catch (err) {
      toast.error("İlan bulunamadı. Lütfen geçerli bir İlan ID girin.");
      setTargetListing(null);
    } finally {
      setSearchingListing(false);
    }
  };

  // Form Değer Değiştirici
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Çoklu seçim toggle (array)
  const handleToggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const exists = current.includes(item);
      return {
        ...prev,
        [field]: exists ? current.filter((x) => x !== item) : [...current, item],
      };
    });
  };

  // Formu Gönder
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("access");
    if (!token) {
      toast.error("Alarm oluşturmak için lütfen önce giriş yapınız.");
      return;
    }

    try {
      setLoading(true);

      if (alarmType === "new_listing_check") {
        // Kriter Parametrelerini Hazırla
        const params = { category };

        if (formData.min_price) params.min_price = Number(formData.min_price);
        if (formData.max_price) params.max_price = Number(formData.max_price);

        if (category === "car") {
          if (formData.brands.length > 0) params.brands = formData.brands;
          if (formData.transmission_types.length > 0) {
            params.transmission_types = formData.transmission_types;
          }
          if (formData.max_km) params.max_km = Number(formData.max_km);
        } else if (category === "house") {
          if (formData.number_of_rooms.length > 0) {
            params.number_of_rooms = formData.number_of_rooms;
          }
          if (formData.min_meter_squared) {
            params.min_meter_squared = Number(formData.min_meter_squared);
          }
          if (formData.floor.length > 0) params.floor = formData.floor;
        }

        await createAlarm({
          alarm_type: "new_listing_check",
          params: params,
        });

        toast.success(
          "Yeni ilan arama alarmı başarıyla oluşturuldu! Kriterlerinize uygun ilan eklendiğinde bildirim alacaksınız."
        );
      } else {
        // price_change veya favorite_updated için listing_id zorunludur
        const finalListingId = targetListing?.id || listingIdInput;
        if (!finalListingId) {
          toast.error("Lütfen alarm kurulacak ilanı belirtiniz.");
          setLoading(false);
          return;
        }

        await createAlarm({
          alarm_type: alarmType,
          listing_id: Number(finalListingId),
          params: {},
        });

        toast.success(
          alarmType === "price_change"
            ? "Fiyat değişim alarmı başarıyla oluşturuldu!"
            : "İlan güncelleme alarmı başarıyla oluşturuldu!"
        );
      }

      if (onAlarmCreated) onAlarmCreated();
      onClose();
    } catch (err) {
      toast.error(formatApiError(err) || "Alarm oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#232E3D] bg-[#161F2B] p-6 shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232E3D] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8A33D]/15 text-[#E8A33D]">
              <Radio size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#EDEFF2]">Alarm Oluştur</h2>
              <p className="text-xs text-[#8B95A3]">
                İhtiyacınıza uygun alarm tipini seçip ayarlarınızı yapın.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8B95A3] hover:bg-[#232E3D] hover:text-[#EDEFF2] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Alarm Tipi Seçimi (3 Seçenek) */}
          <div>
            <label className="block text-xs font-semibold text-[#8B95A3] uppercase tracking-wider mb-2.5">
              1. Alarm Tipini Seçin
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* Seçenek 1: Yeni İlan Arama Alarmı */}
              <button
                type="button"
                onClick={() => setAlarmType("new_listing_check")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${alarmType === "new_listing_check"
                    ? "border-[#10B981] bg-[#10B981]/10 text-[#EDEFF2] shadow-sm shadow-[#10B981]/20"
                    : "border-[#232E3D] bg-[#121A24] text-[#8B95A3] hover:border-[#232E3D]/80 hover:bg-[#1C2733]"
                  }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg mb-2 ${alarmType === "new_listing_check"
                      ? "bg-[#10B981] text-[#0F1720]"
                      : "bg-[#232E3D] text-[#8B95A3]"
                    }`}
                >
                  <Search size={15} />
                </div>
                <span className="text-xs font-bold text-[#EDEFF2] mb-0.5">
                  Yeni İlan Alarmı
                </span>
                <span className="text-[10px] text-[#8B95A3] leading-tight">
                  Kriterlerinize uygun yeni ilan düştüğünde bildirim alın.
                </span>
              </button>

              {/* Seçenek 2: Fiyat Değişimi */}
              <button
                type="button"
                onClick={() => setAlarmType("price_change")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${alarmType === "price_change"
                    ? "border-[#E8A33D] bg-[#E8A33D]/10 text-[#EDEFF2] shadow-sm shadow-[#E8A33D]/20"
                    : "border-[#232E3D] bg-[#121A24] text-[#8B95A3] hover:border-[#232E3D]/80 hover:bg-[#1C2733]"
                  }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg mb-2 ${alarmType === "price_change"
                      ? "bg-[#E8A33D] text-[#0F1720]"
                      : "bg-[#232E3D] text-[#8B95A3]"
                    }`}
                >
                  <Tag size={15} />
                </div>
                <span className="text-xs font-bold text-[#EDEFF2] mb-0.5">
                  Fiyat Değişimi
                </span>
                <span className="text-[10px] text-[#8B95A3] leading-tight">
                  İlanın fiyatı yükseldiğinde veya düştüğünde bildirim alın.
                </span>
              </button>

              {/* Seçenek 3: İlan Güncelleme */}
              <button
                type="button"
                onClick={() => setAlarmType("favorite_updated")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${alarmType === "favorite_updated"
                    ? "border-[#3B82F6] bg-[#3B82F6]/10 text-[#EDEFF2] shadow-sm shadow-[#3B82F6]/20"
                    : "border-[#232E3D] bg-[#121A24] text-[#8B95A3] hover:border-[#232E3D]/80 hover:bg-[#1C2733]"
                  }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg mb-2 ${alarmType === "favorite_updated"
                      ? "bg-[#3B82F6] text-[#0F1720]"
                      : "bg-[#232E3D] text-[#8B95A3]"
                    }`}
                >
                  <FileEdit size={15} />
                </div>
                <span className="text-xs font-bold text-[#EDEFF2] mb-0.5">
                  İlan Güncelleme
                </span>
                <span className="text-[10px] text-[#8B95A3] leading-tight">
                  İlan detayları veya açıklaması değiştiğinde haberiniz olsun.
                </span>
              </button>
            </div>
          </div>

          {/* 2. Seçilen Alarm Türüne Göre Form */}
          {alarmType === "new_listing_check" ? (
            /* =================== KRİTER FORMU (new_listing_check) =================== */
            <div className="space-y-4 rounded-xl border border-[#232E3D] bg-[#121A24]/60 p-4">
              <div className="flex items-center justify-between border-b border-[#232E3D] pb-3">
                <span className="text-xs font-semibold text-[#EDEFF2]">
                  2. Arama Kriterlerini Belirleyin
                </span>

                {/* Kategori Seçimi (Otomobil vs Konut) */}
                <div className="flex items-center rounded-lg bg-[#161F2B] p-1 border border-[#232E3D]">
                  <button
                    type="button"
                    onClick={() => setCategory("car")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${category === "car"
                        ? "bg-[#E8A33D] text-[#0F1720]"
                        : "text-[#8B95A3] hover:text-[#EDEFF2]"
                      }`}
                  >
                    <Car size={13} />
                    Otomobil
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("house")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${category === "house"
                        ? "bg-[#E8A33D] text-[#0F1720]"
                        : "text-[#8B95A3] hover:text-[#EDEFF2]"
                      }`}
                  >
                    <Home size={13} />
                    Konut
                  </button>
                </div>
              </div>

              {/* Fiyat Aralığı (Ortak) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#8B95A3] mb-1">
                    Min Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    value={formData.min_price}
                    onChange={(e) => handleInputChange("min_price", e.target.value)}
                    placeholder="Örn: 250000"
                    className="w-full rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-2 text-xs text-[#EDEFF2] placeholder-[#505D6D] focus:border-[#E8A33D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#8B95A3] mb-1">
                    Maks Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    value={formData.max_price}
                    onChange={(e) => handleInputChange("max_price", e.target.value)}
                    placeholder="Örn: 1500000"
                    className="w-full rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-2 text-xs text-[#EDEFF2] placeholder-[#505D6D] focus:border-[#E8A33D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Otomobil Özel Alanları */}
              {category === "car" && (
                <>
                  {/* Marka Seçimi */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#8B95A3] mb-1">
                      Marka
                    </label>
                    <select
                      value={formData.brands[0] || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "brands",
                          e.target.value ? [e.target.value] : []
                        )
                      }
                      className="w-full rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-2 text-xs text-[#EDEFF2] focus:border-[#E8A33D] focus:outline-none"
                    >
                      <option value="">Tüm Markalar (Filtresiz)</option>
                      {carBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vites Tipi & Maks KM */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#8B95A3] mb-1">
                        Vites Tipi
                      </label>
                      <select
                        value={formData.transmission_types[0] || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "transmission_types",
                            e.target.value ? [e.target.value] : []
                          )
                        }
                        className="w-full rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-2 text-xs text-[#EDEFF2] focus:border-[#E8A33D] focus:outline-none"
                      >
                        <option value="">Tümü</option>
                        {TRANSMISSIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#8B95A3] mb-1">
                        Maksimum KM
                      </label>
                      <input
                        type="number"
                        value={formData.max_km}
                        onChange={(e) => handleInputChange("max_km", e.target.value)}
                        placeholder="Örn: 150000"
                        className="w-full rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-2 text-xs text-[#EDEFF2] placeholder-[#505D6D] focus:border-[#E8A33D] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Konut Özel Alanları */}
              {category === "house" && (
                <>
                  {/* Oda Sayısı */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#8B95A3] mb-1.5">
                      Oda Sayısı
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ROOM_OPTIONS.map((room) => {
                        const isSelected = formData.number_of_rooms.includes(room);
                        return (
                          <button
                            type="button"
                            key={room}
                            onClick={() =>
                              handleToggleArrayItem("number_of_rooms", room)
                            }
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${isSelected
                                ? "border-[#E8A33D] bg-[#E8A33D]/15 text-[#E8A33D]"
                                : "border-[#232E3D] bg-[#161F2B] text-[#8B95A3] hover:text-[#EDEFF2]"
                              }`}
                          >
                            {room}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Min m² ve Bulunduğu Kat */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#8B95A3] mb-1">
                        Min Metrekare (m²)
                      </label>
                      <input
                        type="number"
                        value={formData.min_meter_squared}
                        onChange={(e) =>
                          handleInputChange("min_meter_squared", e.target.value)
                        }
                        placeholder="Örn: 90"
                        className="w-full rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-2 text-xs text-[#EDEFF2] placeholder-[#505D6D] focus:border-[#E8A33D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#8B95A3] mb-1">
                        Bulunduğu Kat
                      </label>
                      <select
                        value={formData.floor[0] || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "floor",
                            e.target.value ? [e.target.value] : []
                          )
                        }
                        className="w-full rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-2 text-xs text-[#EDEFF2] focus:border-[#E8A33D] focus:outline-none"
                      >
                        <option value="">Tüm Katlar</option>
                        {FLOOR_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* =================== İLAN BAZLI ALARM FORMU (price_change & favorite_updated) =================== */
            <div className="space-y-3 rounded-xl border border-[#232E3D] bg-[#121A24]/60 p-4">
              <span className="block text-xs font-semibold text-[#EDEFF2] mb-1">
                2. Hedef İlanı Belirleyin
              </span>

              {targetListing ? (
                <div className="flex items-center justify-between rounded-lg border border-[#232E3D] bg-[#161F2B] p-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#E8A33D]">
                      Seçili İlan #{targetListing.id}
                    </span>
                    <p className="text-xs font-medium text-[#EDEFF2] mt-0.5">
                      {targetListing.title}
                    </p>
                    <p className="text-xs font-semibold text-emerald-400 mt-1">
                      ₺{Number(targetListing.price).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetListing(null);
                      setListingIdInput("");
                    }}
                    className="text-xs text-[#8B95A3] hover:text-red-400 underline"
                  >
                    Değiştir
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={listingIdInput}
                    onChange={(e) => setListingIdInput(e.target.value)}
                    placeholder="İlan ID numarası girin (Örn: 5)"
                    className="flex-1 rounded-lg border border-[#232E3D] bg-[#161F2B] px-3 py-2 text-xs text-[#EDEFF2] placeholder-[#505D6D] focus:border-[#E8A33D] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSearchListing}
                    disabled={searchingListing || !listingIdInput}
                    className="rounded-lg bg-[#232E3D] px-4 py-2 text-xs font-semibold text-[#EDEFF2] hover:bg-[#E8A33D] hover:text-[#0F1720] transition-colors"
                  >
                    {searchingListing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "İlanı Bul"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Butonları */}
          <div className="flex items-center justify-end gap-3 border-t border-[#232E3D] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#232E3D] bg-transparent px-4 py-2 text-xs font-semibold text-[#8B95A3] hover:bg-[#1C2733] hover:text-[#EDEFF2] transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E8A33D] px-5 py-2 text-xs font-semibold text-[#0F1720] hover:bg-[#F0B058] transition-colors shadow-md shadow-[#E8A33D]/20 disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Alarmı Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
