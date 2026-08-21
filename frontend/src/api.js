const API_BASE = "http://localhost:8001/api/listings";

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
  const token = localStorage.getItem("access_token");
  // if token is not exist, it means user is not logged in. throw an error.
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
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}

// Photo adding
export async function uploadListingImages(listingId, files) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Lütfen önce giriş yapın.");
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Fotoğraf yüklenemedi." }));
    throw new Error(formatApiError(err));
  }
  return res.json();
}
