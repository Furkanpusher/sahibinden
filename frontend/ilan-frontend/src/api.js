const API_BASE = "http://localhost:8001/api/listings";

export async function fetchListings(path, params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
  ).toString();

  const url = `${API_BASE}${path}${query ? `?${query}` : ""}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`İstek başarısız: ${res.status}`);
  }
  return res.json();
}

export async function postListing(path, data) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Lütfen önce giriş yapın.");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    const ilkHata = err.detail || (typeof err === "object" ? Object.values(err).flat()[0] : "Bir hata oluştu.");
    throw new Error(String(ilkHata));
  }
  return res.json();
}

// 📸 ÇOKLU FOTOĞRAF YÜKLEME FONKSİYONU
export async function uploadListingImages(listingId, files) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Lütfen önce giriş yapın.");
  }

  const formData = new FormData();
  // Backend'deki getlist('images') için her dosyayı 'images' key'i ile ekliyoruz
  for (let i = 0; i < files.length; i++) {
    formData.append("images", files[i]);
  }

  const res = await fetch(`${API_BASE}/listing/${listingId}/upload-images/`, {
    method: "POST",
    headers: {
      // Content-Type yazmıyoruz! Tarayıcı boundary ile kendisi ayarlar.
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    const ilkHata = err.detail || (typeof err === "object" ? Object.values(err).flat()[0] : "Fotoğraf yüklenemedi.");
    throw new Error(String(ilkHata));
  }
  return res.json();
}
