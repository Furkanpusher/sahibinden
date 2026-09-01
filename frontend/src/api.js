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

export function isTokenExpired(token) {
  const t = token || localStorage.getItem("access_token") || localStorage.getItem("access");
  if (!t) return true;
  try {
    const payload = JSON.parse(atob(t.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    // 10 second safety buffer to prevent token expiring mid-request
    return payload.exp < now + 10;
  } catch {
    return true;
  }
}

let isRedirecting = false;
let refreshPromise = null; // Mutex to prevent multiple parallel refresh requests

export class SessionExpiredError extends Error {
  constructor(message = "Oturum süreniz dolmuştur. Lütfen tekrar giriş yapınız.") {
    super(message);
    this.name = "SessionExpiredError";
    this.isSessionExpired = true;
  }
}

export function handleSessionExpired() {
  if (isRedirecting) return;
  isRedirecting = true;

  toast.error("Oturum süreniz dolmuştur. Lütfen tekrar giriş yapınız.", {
    id: "session-expired-toast",
  });

  // clear local storage
  localStorage.removeItem("access_token");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user");
  localStorage.removeItem("is_staff");

  setTimeout(() => {
    isRedirecting = false;
    window.location.href = "/login";
  }, 2000);
}

// Silently refreshes the access token using the refresh token
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token") || localStorage.getItem("refresh");
  if (!refreshToken || isTokenExpired(refreshToken)) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }

  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/accounts/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) {
        handleSessionExpired();
        throw new SessionExpiredError();
      }

      const data = await res.json();
      const newAccessToken = data.access || data.access_token;
      localStorage.setItem("access_token", newAccessToken);
      localStorage.setItem("access", newAccessToken);
      if (data.refresh || data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh || data.refresh_token);
        localStorage.setItem("refresh", data.refresh || data.refresh_token);
      }
      return newAccessToken;
    } catch (err) {
      if (!(err instanceof SessionExpiredError)) {
        handleSessionExpired();
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Retrieves a guaranteed valid access token (refreshes silently if expired)
export async function getValidAccessToken() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
  if (token && !isTokenExpired(token)) {
    return token;
  }
  return await refreshAccessToken();
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

// Generic authenticated fetch helper with automatic 401 retry & silent refresh
export async function authFetch(url, options = {}, retryOn401 = true) {
  const token = await getValidAccessToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(url, { ...options, headers });

  // If server returns 401 Unauthorized, attempt a silent refresh once and retry
  if (res.status === 401 && retryOn401) {
    try {
      const newToken = await refreshAccessToken();
      const retryHeaders = {
        ...(options.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };
      res = await fetch(url, { ...options, headers: retryHeaders });
    } catch {
      handleSessionExpired();
      throw new SessionExpiredError();
    }
  }

  if (res.status === 401) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }

  return res;
}

export async function postListing(path, data) {
  const res = await authFetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

// Photo adding
export async function uploadListingImages(listingId, files) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("images", files[i]);
  }

  const res = await authFetch(`${API_BASE}/listings/${listingId}/images/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Fotoğraf yüklenemedi." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
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

