import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

logger = logging.getLogger(__name__)

# JSON dosyasının mutlak yolunu map_services.py dosyasının konumuna göre hesapla
# listings/services/map_services.py -> services (parent) -> listings (parents[1]) -> backend (parents[2])
BASE_DIR = Path(__file__).resolve().parents[2]
COORDINATES_FILE = BASE_DIR / "district_coordinates.json"


def _normalize_key(text: Optional[str]) -> str:
    """Türkçe karakterleri ve boşlukları normalize ederek arama anahtarı üretir."""
    if not text:
        return ""
    # Türkçe İ/ı karakter dönüşüm toleransı ve temizleme
    return (
        text.strip()
        .replace("I", "ı")
        .replace("İ", "i")
        .lower()
    )


def _load_coordinates() -> Dict[Tuple[str, str], Dict[str, float]]:
    """
    Uygulama ayağa kalktığında JSON dosyasını okuyup
    (sehir, ilce) -> {'latitude': ..., 'longitude': ...} sözlüğü oluşturur.
    """
    lookup: Dict[Tuple[str, str], Dict[str, float]] = {}

    if not COORDINATES_FILE.exists():
        logger.warning(f"Koordinat dosyası bulunamadı: {COORDINATES_FILE}")
        return lookup

    try:
        with open(COORDINATES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data:
            city = _normalize_key(item.get("city"))
            district = _normalize_key(item.get("district"))
            lat = item.get("latitude")
            lng = item.get("longitude")

            if city and district and lat is not None and lng is not None:
                lookup[(city, district)] = {
                    "latitude": float(lat),
                    "longitude": float(lng),
                }

        logger.info(f"{len(lookup)} adet ilçe koordinatı belleğe yüklendi.")
    except Exception as e:
        logger.error(f"Koordinat dosyası yüklenirken hata oluştu: {e}")

    return lookup


# Modül import edildiği anda hafızaya (RAM) yüklenir (In-Memory Singleton)
DISTRICT_COORDINATES: Dict[Tuple[str, str], Dict[str, float]] = _load_coordinates()


def get_district_coordinates(city: Optional[str], district: Optional[str]) -> Optional[Dict[str, float]]:
    """
    Verilen şehir ve ilçe adı için hafızadaki koordinatı O(1) hızında döner.
    Örnek çıktı: {'latitude': 37.0259117, 'longitude': 35.8169997} veya None
    """
    if not city or not district:
        return None

    key = (_normalize_key(city), _normalize_key(district))
    return DISTRICT_COORDINATES.get(key)


if __name__ == "__main__":
    print(f"Dosya yolu: {COORDINATES_FILE}")
    print(f"Toplam yüklenen kayıt: {len(DISTRICT_COORDINATES)}")
    sample = get_district_coordinates("Adana", "Ceyhan")
    print(f"Örnek sorgu ('Adana', 'Ceyhan'): {sample}")
    sample_lower = get_district_coordinates("adana", "ceyhan")
    print(f"Küçük harf testi ('adana', 'ceyhan'): {sample_lower}")
