import { toast } from "sonner";

const API_BASE = "http://localhost:8001/api/listings";
export const BACKEND_BASE = "http://127.0.0.1:8001";

const carFallbackImages = [
  "/car-1.jpg", "/car-2.jpg", "/car-3.jpg", "/car-4.jpg", "/car-5.jpg",
  "/car-6.jpg", "/car-7.jpg", "/car-8.jpg", "/car-9.jpg", "/car-10.jpg",
];

const houseFallbackImages = [
  "/house-1.jpg", "/house-2.jpg", "/house-3.jpg", "/house-4.jpg", "/house-5.jpg",
  "/house-6.jpg", "/house-7.jpg", "/house-8.jpg", "/house-9.jpg", "/house-10.jpg",
];

export const formatImgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const getListingCoverImage = (item, preferredType = null) => {
  if (!item) return "/car-1.jpg";

  // 1. Galeri resimlerinden kapak (is_cover = true) olanı veya ilk resmi al
  const coverObj = item.images?.find((img) => img.is_cover) || item.images?.[0];
  const rawUrl = coverObj?.image || item.image || item.imageUrl;

  if (rawUrl) {
    return formatImgUrl(rawUrl);
  }

  // 2. Yüklenmiş görsel yoksa kategoriye ve ID'ye göre sabit fallback seç
  const isHouse =
    preferredType === "house" ||
    item.listing_type === "house" ||
    item.meter_squared !== undefined ||
    item.number_of_rooms !== undefined;

  const fallbackList = isHouse ? houseFallbackImages : carFallbackImages;
  const idNum = Number(item.id) || 0;
  return fallbackList[Math.abs(idNum) % fallbackList.length];
};

export function isTokenExpired() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

let isRedirecting = false;

export class SessionExpiredError extends Error {
  constructor(message = "Oturum süreniz dolmuştur. Lütfen tekrar giriş yapınız.") {
    super(message);
    this.name = "SessionExpiredError";
    this.isSessionExpired = true;
  }
}

export function handleSessionExpired() {
  toast.error("Oturum süreniz dolmuştur. Lütfen tekrar giriş yapınız.", {
    id: "session-expired-toast",
  });

  // clear the local storage
  localStorage.removeItem("access_token");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user");
  localStorage.removeItem("is_staff");

  if (!isRedirecting) {
    isRedirecting = true;
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  }
}


export function formatApiError(err) {
  if (!err) return "Bir hata oluştu.";
  if (typeof err === "string") return err;
  if (err.detail) return String(err.detail);
  if (err.message) return String(err.message);
  if (Array.isArray(err)) return String(err[0]);
  if (typeof err === "object") {
    const firstKey = Object.keys(err)[0];
    if (firstKey) {
      const val = err[firstKey];
      const message = Array.isArray(val) ? val[0] : (typeof val === "object" ? formatApiError(val) : val);
      return `${firstKey}: ${message}`;
    }
  }
  return "Bir hata oluştu.";
}

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
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");

  if (!token || isTokenExpired()) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (res.status === 401) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

// Photo adding
export async function uploadListingImages(listingId, files) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");

  if (!token || isTokenExpired()) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("images", files[i]);
  }

  const res = await fetch(`${API_BASE}/listings/${listingId}/images/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (res.status === 401) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Fotoğraf yüklenemedi." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

// Generic authenticated fetch helper
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");

  if (!token || isTokenExpired()) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }

  const headers = {
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }

  return res;
}


// NOTIFICATION FUNCTIONS

export async function getNotifications() {
  const res = await authFetch(`${API_BASE}/notifications/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Bildirimler alınamadı." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}
// for marking notifications as read (supports single ID or all)
export async function markNotificationsAsRead(notificationId = null) {
  const res = await authFetch(`${API_BASE}/notifications/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(notificationId ? { notification_id: notificationId } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Bildirimler güncellenemedi." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

export async function deleteNotification(notificationId) {
  const res = await authFetch(`${API_BASE}/notifications/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notification_id: notificationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Bildirim silinemedi." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}


// FOLLOW & SELLER PROFILE FUNCTIONS

export async function toggleFollowSeller(sellerId) {
  const res = await authFetch(`${API_BASE}/sellers/${sellerId}/follow/`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Takip işlemi başarısız oldu." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

export async function getFollowedSellers() {
  const res = await authFetch(`${API_BASE}/following/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Takip edilen satıcılar alınamadı." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

export async function getSellerProfile(sellerId, page = 1) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}/sellers/${sellerId}/?page=${page}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Satıcı profili bulunamadı." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

// ALARM FUNCTIONS

export async function getAlarms() {
  const res = await authFetch(`${API_BASE}/alarms/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Alarmlar alınamadı." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

export async function createAlarm(data) {
  const res = await authFetch(`${API_BASE}/alarms/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Alarm oluşturulamadı." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

export async function toggleAlarm(pk) {
  const res = await authFetch(`${API_BASE}/alarms/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pk }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Alarm durumu güncellenemedi." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

export async function deleteAlarm(pk) {
  const res = await authFetch(`${API_BASE}/alarms/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pk }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Alarm silinemedi." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

