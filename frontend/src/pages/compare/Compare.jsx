import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Scale,
  Loader2,
  AlertCircle,
  ExternalLink,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { fetchListings } from "../../api";
import { useCompare } from "../../context/CompareContext";
import UserMenu from "../../components/UserMenu";

const defaultImages = [
  "/car-1.jpg", "/car-2.jpg", "/car-3.jpg", "/car-4.jpg", "/car-5.jpg",
  "/car-6.jpg", "/car-7.jpg", "/car-8.jpg", "/car-9.jpg", "/car-10.jpg",
];

const BACKEND_BASE = "http://127.0.0.1:8001";

const getCoverImage = (item) => {
  const coverFromGallery = item.images?.find((img) => img.is_cover)?.image || item.images?.[0]?.image;
  const rawUrl = coverFromGallery || item.image || item.imageUrl;

  if (rawUrl) {
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
    return `${BACKEND_BASE}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  }
  return defaultImages[item.id % defaultImages.length];
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "-";
  return `${new Intl.NumberFormat("tr-TR").format(price)} TL`;
};

const formatKm = (km) => {
  if (km === null || km === undefined || km === "") return "-";
  return `${new Intl.NumberFormat("tr-TR").format(km)} km`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  const type = searchParams.get("type") || (compareItems.length > 0 ? "car" : "car");
  const idsParam = searchParams.get("ids") || compareItems.map((i) => i.id).join(",");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idsParam) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = type === "house" ? "/houses/" : "/cars/";

    fetchListings(endpoint, { ids: idsParam })
      .then((data) => {
        const results = data.results || (Array.isArray(data) ? data : []);
        setItems(results);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type, idsParam]);

  const handleRemove = (id) => {
    removeFromCompare(id);
    const remaining = items.filter((item) => item.id !== id);
    setItems(remaining);
    if (remaining.length > 0) {
      navigate(`/karsilastir?type=${type}&ids=${remaining.map((i) => i.id).join(",")}`, {
        replace: true,
      });
    } else {
      navigate(type === "house" ? "/houses" : "/cars");
    }
  };

  // Araç özellikleri tanımı
  const carAttributes = [
    { label: "Fiyat", key: "price", format: (v) => formatPrice(v), highlightPrice: true },
    { label: "Marka", key: "brand" },
    { label: "Model", key: "model" },
    { label: "Seri", key: "series" },
    { label: "Yıl", key: "year" },
    { label: "Kilometre", key: "km", format: (v) => formatKm(v) },
    { label: "Vites Tipi", key: "transmission_type" },
    { label: "Yakıt Tipi", key: "fuel_type" },
    { label: "Kasa Tipi", key: "body_type" },
    { label: "Renk", key: "color" },
    { label: "Motor Gücü", key: "engine_power", format: (v) => (v ? `${v} HP` : "-") },
    { label: "Motor Hacmi", key: "engine_size", format: (v) => (v ? `${v} cc` : "-") },
    { label: "Çekiş", key: "traction" },
    { label: "Ortalama Yakıt", key: "avg_fuel_consumption", format: (v) => (v ? `${v} lt` : "-") },
    { label: "Hasar Durumu / Tramer", key: "tramer", format: (v) => (v ? `${v} TL` : "Hasarsız / 0 TL") },
    { label: "Değişen Parça", key: "changed_parts", format: (v) => v || "Belirtilmemiş" },
    { label: "Takas", key: "for_trade", format: (v) => (v ? "Evet" : "Hayır") },
    { label: "Kimden", key: "from_whom" },
    { label: "İl / İlçe", key: "location", custom: (item) => [item.city, item.district].filter(Boolean).join(" / ") || "-" },
    { label: "İlan Tarihi", key: "listing_date", format: (v) => formatDate(v) },
  ];

  // Konut özellikleri tanımı
  const houseAttributes = [
    { label: "Fiyat", key: "price", format: (v) => formatPrice(v), highlightPrice: true },
    { label: "Metrekare (m²)", key: "meter_squared", format: (v) => (v ? `${v} m²` : "-") },
    { label: "Oda Sayısı", key: "number_of_rooms" },
    { label: "Bulunduğu Kat", key: "floor" },
    { label: "Kat Sayısı", key: "number_of_floors" },
    { label: "Bina Yaşı", key: "building_aged", format: (v) => (v ? `${v} Yaş` : "-") },
    { label: "Krediye Uygunluk", key: "credit_eligibility", format: (v) => (v ? "Evet" : "Hayır") },
    { label: "İl / İlçe", key: "location", custom: (item) => [item.city, item.district].filter(Boolean).join(" / ") || "-" },
    { label: "İlan Tarihi", key: "listing_date", format: (v) => formatDate(v) },
  ];

  const attributes = type === "house" ? houseAttributes : carAttributes;

  return (
    <div className="min-h-screen bg-[#0F1720] px-4 py-5 text-[#EDEFF2] sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-7 border-b border-[#232E3D] pb-5">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(type === "house" ? "/houses" : "/cars")}
              className="group inline-flex items-center gap-2 text-sm font-medium text-[#8B95A3] transition-colors hover:text-[#EDEFF2]"
            >
              <ArrowLeft
                size={16}
                className="transition-transform duration-200 group-hover:-translate-x-1"
              />
              {type === "house" ? "Konut İlanlarına Dön" : "Araç İlanlarına Dön"}
            </button>

            <UserMenu />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8A33D]/10 text-[#E8A33D]">
                  <Scale size={20} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#EDEFF2] sm:text-3xl">
                  {type === "house" ? "Konut Karşılaştırma" : "Araç Karşılaştırma"}
                </h1>
              </div>
              <p className="mt-1 text-sm text-[#667384]">
                Seçtiğiniz ilanların tüm teknik ve genel özelliklerini yan yana kıyaslayın.
              </p>
            </div>

            {items.length >= 2 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearCompare();
                    navigate(type === "house" ? "/houses" : "/cars");
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-[#232E3D] bg-[#161F2B] px-3.5 py-2 text-xs font-medium text-[#8B95A3] hover:text-red-400 transition-colors"
                  title="Tümünü Temizle"
                >
                  <RotateCcw size={13} />
                  <span>Temizle</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-[#8B95A3]">
            <Loader2 size={36} className="mb-3 animate-spin text-[#E8A33D]" />
            <p className="text-sm font-medium">İlanlar karşılaştırılıyor...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[#E88080]/30 bg-[#E88080]/10 p-5 text-center text-[#E88080]">
            <AlertCircle size={24} className="mx-auto mb-2" />
            <p className="text-sm font-medium">Hata: {error}</p>
          </div>
        )}

        {/* Yetersiz İlan Durumu */}
        {!loading && !error && items.length < 2 && (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#2B3747] bg-[#161F2B]/40 p-10 text-center">
            <Scale size={48} className="mb-4 text-[#667384]" />
            <h3 className="text-lg font-semibold text-[#EDEFF2]">Karşılaştırma İçin Yetersiz İlan</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#8B95A3]">
              Karşılaştırma yapabilmek için en az 2 ilan seçmelisiniz. İlan listesinden seçim kutucuklarını kullanarak ilan ekleyebilirsiniz.
            </p>
            <Link
              to={type === "house" ? "/houses" : "/cars"}
              className="mt-6 rounded-lg bg-[#E8A33D] px-5 py-2.5 text-sm font-bold text-[#0F1720] transition-colors hover:bg-[#F0B058]"
            >
              İlanları İncele
            </Link>
          </div>
        )}

        {/* Karşılaştırma Tablosu */}
        {!loading && !error && items.length >= 2 && (
          <div className="overflow-x-auto rounded-2xl border border-[#232E3D] bg-[#161F2B]/80 shadow-2xl">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              {/* Sticky İlan Kartları Başlık Satırı */}
              <thead>
                <tr className="border-b border-[#232E3D] bg-[#1a2533]">
                  <th className="w-48 p-4 font-semibold text-[#8B95A3] align-bottom">
                    <div className="text-xs uppercase tracking-wider text-[#667384]">Özellikler</div>
                    <div className="text-sm font-bold text-[#EDEFF2] mt-1">
                      {items.length} İlan Kıyaslanıyor
                    </div>
                  </th>
                  {items.map((item) => {
                    const coverImg = getCoverImage(item);
                    const detailUrl = type === "house" ? `/houses/${item.id}` : `/cars/${item.id}`;

                    return (
                      <th
                        key={item.id}
                        className="p-4 align-top min-w-[220px] max-w-[280px]"
                      >
                        <div className="relative group">
                          {/* Kaldır Butonu */}
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F1720]/80 text-[#8B95A3] hover:bg-[#E88080] hover:text-white transition-all shadow-md"
                            title="Bu ilanı karşılaştırmadan çıkar"
                          >
                            <Trash2 size={12} />
                          </button>

                          {/* Fotoğraf */}
                          <Link
                            to={detailUrl}
                            className="block relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#232E3D] bg-[#0F1720] transition-transform duration-200 hover:scale-[1.02]"
                          >
                            <img
                              src={coverImg}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          </Link>

                          {/* Başlık */}
                          <Link
                            to={detailUrl}
                            className="mt-3 block font-semibold text-sm text-[#EDEFF2] hover:text-[#E8A33D] line-clamp-2 leading-snug transition-colors"
                            title={item.title}
                          >
                            {item.title}
                          </Link>

                          {/* Fiyat */}
                          <div className="mt-2 text-base font-bold text-[#E8A33D]">
                            {formatPrice(item.price)}
                          </div>

                          {/* İlana Git Linki */}
                          <Link
                            to={detailUrl}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#232E3D] bg-[#0F1720] px-3 py-1.5 text-xs font-medium text-[#C8D1DC] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-all"
                          >
                            <span>İlana Git</span>
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Özellik Satırları */}
              <tbody className="divide-y divide-[#232E3D]/50 text-[#EDEFF2]">
                {attributes.map((attr) => (
                  <tr
                    key={attr.key}
                    className="transition-colors hover:bg-[#1a2533]/50"
                  >
                    {/* Özellik Adı */}
                    <td className="py-3 px-4 font-semibold text-xs text-[#8B95A3] bg-[#141C27]/60">
                      {attr.label}
                    </td>

                    {/* İlan Değerleri */}
                    {items.map((item) => {
                      let value = attr.custom
                        ? attr.custom(item)
                        : item[attr.key];

                      if (attr.format) {
                        value = attr.format(value);
                      } else if (value === null || value === undefined || value === "") {
                        value = "-";
                      }

                      return (
                        <td
                          key={`${item.id}-${attr.key}`}
                          className={`py-3 px-4 font-medium text-sm ${
                            attr.highlightPrice
                              ? "text-[#E8A33D] font-bold text-base"
                              : "text-[#EDEFF2]"
                          }`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
