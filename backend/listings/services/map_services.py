import json
import logging
from django.conf import settings
from typing import Optional, Tuple, Dict, Any

logger = logging.getLogger(__name__)

COORDINATES_FILE = settings.BASE_DIR / "district_coordinates.json"


def _normalize_key(text: Optional[str]) -> str:
    # normalize the turkish characters
    if not text:
        return ""
    return (
        text.strip()
        .replace("I", "ı")
        .replace("İ", "i")
        .lower()
    )


def _load_coordinates() -> Dict[Tuple[str, str], Dict[str, float]]:
    # {[Ankara, Mamak]} -> {[latitude, 40.99], [longitude, 32.91]}
    """
    when the app starts it reads the json file
    creates a dictionary of (sehir, ilce) -> {'latitude': ..., 'longitude': ...} 
    """
    lookup: Dict[Tuple[str, str], Dict[str, float]] = {}

    if not COORDINATES_FILE.exists():
        logger.warning(f"Koordinat dosyası bulunamadı: {COORDINATES_FILE}")
        return lookup

    try:
        with open(COORDINATES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data:
            city = _normalize_key(item.get("city"))  # simple turkish check
            district = _normalize_key(item.get("district"))
            lat = item.get("latitude")
            lng = item.get("longitude")

            if city and district and lat is not None and lng is not None:
                lookup[(city, district)] = {
                    "latitude": float(lat),  # should be float for leaflet
                    "longitude": float(lng),
                }

        logger.info(f"{len(lookup)} adet ilçe koordinatı belleğe yüklendi.")
    except Exception as e:
        logger.error(f"Koordinat dosyası yüklenirken hata oluştu: {e}")

    return lookup


# now it's in the ram
DISTRICT_COORDINATES: Dict[Tuple[str, str],
                           Dict[str, float]] = _load_coordinates()


# this is the function we'll use in the mapView
def get_district_coordinates(city: Optional[str], district: Optional[str]) -> Optional[Dict[str, float]]:
    """
    it gives the coordinates given the city and district
    """
    if not city or not district:
        return None

    key = (_normalize_key(city), _normalize_key(district))
    return DISTRICT_COORDINATES.get(key)
