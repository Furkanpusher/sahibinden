import { toast } from "sonner";

const API_BASE = "http://localhost:8001/api/listings";

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
// for marking the notifications as read
export async function markNotificationsAsRead() {
  const res = await authFetch(`${API_BASE}/notifications/`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Bildirimler güncellenemedi." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}
