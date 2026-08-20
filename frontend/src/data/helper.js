import ilRaw from "./il.json";
import ilceRaw from "./ilce.json";
import carListRaw from "./car-list.json";

// Türkçe karakter uyumlu Baş Harfi Büyük yapma fonksiyonu (Örn: "İSTANBUL" -> "İstanbul")
const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
};

// 1. Ham JSON verilerini güvenle ayıkla
const rawCities = Array.isArray(ilRaw)
  ? ilRaw.find((item) => item.data)?.data || ilRaw
  : [];

const rawDistricts = Array.isArray(ilceRaw)
  ? ilceRaw.find((item) => item.data)?.data || ilceRaw
  : [];

const rawCars = Array.isArray(carListRaw) ? carListRaw : [];

// 🏙️ 1. TÜM ŞEHİRLERİ LİSTELE (Alfabetik)
export const getCities = () => {
  return rawCities
    .map((c) => ({
      id: String(c.id),
      name: toTitleCase(c.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));
};

// 📍 2. SEÇİLEN ŞEHRİN İLÇELERİNİ LİSTELE
export const getDistricts = (cityName) => {
  if (!cityName) return [];

  // Şehrin ID'sini bul (Büyük/küçük harf duyarsız)
  const targetCity = rawCities.find(
    (c) =>
      toTitleCase(c.name).toLocaleLowerCase("tr-TR") ===
      cityName.toLocaleLowerCase("tr-TR")
  );

  if (!targetCity) return [];

  // O il_id'ye ait ilçeleri filtrele ve sırala
  return rawDistricts
    .filter((d) => String(d.il_id) === String(targetCity.id))
    .map((d) => toTitleCase(d.name))
    .sort((a, b) => a.localeCompare(b, "tr-TR"));
};

// 🚗 3. TÜM ARAÇ MARKALARINI LİSTELE (Alfabetik)
export const getCarBrands = () => {
  return rawCars
    .map((c) => c.brand)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "tr-TR"));
};

// 🚘 4. SEÇİLEN MARKAYA AİT MODELLERİ LİSTELE
export const getCarModels = (brandName) => {
  if (!brandName) return [];

  const foundBrand = rawCars.find(
    (c) => c.brand?.toLowerCase() === brandName.toLowerCase()
  );

  return foundBrand?.models ? [...foundBrand.models].sort() : [];
};
