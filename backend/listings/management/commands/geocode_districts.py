"""
Django management command: geocode_districts

Kullanım:
    1. Bu dosyayı şu klasöre koy: <app_adi>/management/commands/geocode_districts.py
       (management/ ve management/commands/ klasörlerinin altına birer boş
       __init__.py eklemeyi unutma)
    2. Aşağıdaki "AYARLANMASI GEREKENLER" bölümünü kendi modeline göre düzenle.
    3. Çalıştır:
       python manage.py geocode_districts

Çıktı: proje kök dizininde district_coordinates.json dosyası.
Format:
[
  {
    "id": 1,
    "city": "İstanbul",
    "district": "Kadıköy",
    "latitude": 40.9927,
    "longitude": 29.0275
  },
  ...
]

Notlar:
- Nominatim kullanım politikası gereği saniyede en fazla 1 istek atılır
  (script bunu kendisi ayarlıyor, elleme).
- Bulunamayan semtler "not_found.json" dosyasına ayrıca yazılır, elle
  düzeltip tekrar deneyebilirsin.
- Aynı script'i tekrar çalıştırırsan zaten bulunanları atlar (cache),
  sadece eksikleri geocode eder — yani kesintiye uğrarsa kaldığı yerden devam eder.
"""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

from django.core.management.base import BaseCommand
# ---------------- AYARLANMASI GEREKENLER ----------------
from listings.models import Listing

CITY_FIELD = "city"        # modeldeki şehir alanının adı
DISTRICT_FIELD = "district"  # modeldeki semt/ilçe alanının adı
# ----------------------------------------------------------

OUTPUT_FILE = Path("district_coordinates.json")
NOT_FOUND_FILE = Path("not_found.json")
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "tr,en;q=0.9",
}


class Command(BaseCommand):
    help = "Listing modelindeki distinct city+district çiftlerini Nominatim ile geocode eder"

    def handle(self, *args, **options):
        pairs = (
            Listing.objects.values_list(CITY_FIELD, DISTRICT_FIELD)
            .distinct()
            .order_by(CITY_FIELD, DISTRICT_FIELD)
        )
        pairs = [(c.strip(), d.strip()) for c, d in pairs if c and d]
        self.stdout.write(f"{len(pairs)} benzersiz şehir+semt çifti bulundu.")

        results = self._load_existing(OUTPUT_FILE)
        not_found = self._load_existing(NOT_FOUND_FILE)
        done_keys = {(r["city"], r["district"]) for r in results}
        done_keys |= {(r["city"], r["district"]) for r in not_found}

        next_id = (max((r["id"] for r in results), default=0)) + 1

        for city, district in pairs:
            if (city, district) in done_keys:
                continue

            status, coords = self._geocode(district, city)
            if status == "OK" and coords:
                results.append(
                    {
                        "id": next_id,
                        "city": city,
                        "district": district,
                        "latitude": coords[0],
                        "longitude": coords[1],
                    }
                )
                next_id += 1
                self.stdout.write(self.style.SUCCESS(f"  OK   {district}, {city} -> {coords}"))
                self._save(OUTPUT_FILE, results)
            elif status == "NOT_FOUND":
                not_found.append({"city": city, "district": district})
                self.stdout.write(self.style.WARNING(f"  YOK  {district}, {city}"))
                self._save(NOT_FOUND_FILE, not_found)
            else:
                # Network error, do not add to not_found so it can be retried
                self.stdout.write(self.style.ERROR(f"  HATA {district}, {city} (Atlandı, tekrar denenecek)"))

            time.sleep(1.1)  # Nominatim: saniyede max 1 istek

        self.stdout.write(self.style.SUCCESS(
            f"\nBitti. {len(results)} semt bulundu, {len(not_found)} semt bulunamadı."
        ))

    def _geocode(self, district, city):
        # If district is "Merkez", search for the city itself
        query = f"{city}, Türkiye" if district.lower() in ["merkez", "merkezi"] else f"{district}, {city}, Türkiye"
        params = urllib.parse.urlencode(
            {"q": query, "format": "json", "limit": "1"}
        )
        url = f"{NOMINATIM_URL}?{params}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    if data and len(data) > 0:
                        return "OK", (float(data[0]["lat"]), float(data[0]["lon"]))
                    return "NOT_FOUND", None
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  Ağ Hatası ({district}, {city}): {e}"))
            return "ERROR", None
        return "NOT_FOUND", None

    @staticmethod
    def _load_existing(path: Path):
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        return []

    @staticmethod
    def _save(path: Path, data):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

