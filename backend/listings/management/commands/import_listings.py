# csv dosyalarını veritabanına yazar

import csv
import re
from datetime import date

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from listings.models import CarListing, HouseListing

TURKISH_MONTHS = {
    "ocak": 1, "şubat": 2, "mart": 3, "nisan": 4, "mayıs": 5, "haziran": 6,
    "temmuz": 7, "ağustos": 8, "eylül": 9, "ekim": 10, "kasım": 11, "aralık": 12,
}


def temizle_sayi(deger):
    """'1.169.000 TL' / '124.000 km' -> 1169000 (int). Boşsa None döner."""
    if not deger or not str(deger).strip():
        return None
    rakamlar = re.sub(r"[^\d]", "", str(deger))
    return int(rakamlar) if rakamlar else None


def temizle_ondalik(deger):
    """Tramer gibi ondalıklı alanlar için. Boşsa None döner."""
    if not deger or not str(deger).strip():
        return None
    try:
        return float(str(deger).replace(".", "").replace(",", "."))
    except ValueError:
        return None


def temizle_tarih(deger):
    """'21 Ağustos 2025' -> date(2025, 8, 21). Parse edemezse None döner."""
    if not deger or not str(deger).strip():
        return None
    parcalar = str(deger).strip().split()
    if len(parcalar) != 3:
        return None
    gun_str, ay_str, yil_str = parcalar
    ay = TURKISH_MONTHS.get(ay_str.lower())
    if not ay:
        return None
    try:
        return date(int(yil_str), ay, int(gun_str))
    except ValueError:
        return None


def temizle_bool(deger, pozitif_kelime):
    """'Takasa Uygun' / 'Takasa Uygun Değil' gibi alanları bool'a çevirir."""
    if not deger or not str(deger).strip():
        return None
    return pozitif_kelime.lower() in str(deger).lower() and "değil" not in str(deger).lower()


VITES_MAP = {
    "düz": "manuel",
    "duz": "manuel",
    "manuel": "manuel",
    "manual": "manuel",
    "otomatik": "otomatik",
    "automatic": "otomatik",
    "yarı otomatik": "yarı otomatik",
    "yari otomatik": "yarı otomatik",
}


def temizle_vites(deger):
    """'Düz', 'Manuel', 'Otomatik', 'Yarı Otomatik' -> modeldeki seçenek ('manuel', 'otomatik', 'yarı otomatik')."""
    if not deger or not str(deger).strip():
        return ""
    v = str(deger).strip().lower()
    return VITES_MAP.get(v, v)


def araba_satirini_isle(satir):
    return CarListing(
        title=satir.get("baslik", "") or "",
        location=satir.get("konum", "") or "",
        price=temizle_sayi(satir.get("fiyat")) or 0,
        listing_date=temizle_tarih(satir.get("ilan_tarihi")),
        brand=satir.get("marka", "") or "",
        series=satir.get("seri", "") or "",
        model=satir.get("model", "") or "",
        year=temizle_sayi(satir.get("yil")),
        km=temizle_sayi(satir.get("kilometre")),
        transmission_type=temizle_vites(satir.get("vites_tipi")),
        fuel_type=satir.get("yakit_tipi", "") or "",
        body_type=satir.get("kasa_tipi", "") or "",
        color=satir.get("renk", "") or "",
        engine_size=satir.get("motor_hacmi", "") or "",
        engine_power=satir.get("motor_gucu", "") or "",
        traction=satir.get("cekis", "") or "",
        status=satir.get("arac_durumu", "") or "",
        avg_fuel_consumption=satir.get("ortalama_yakit_tuketimi", "") or "",
        fuel_tank=satir.get("yakit_deposu", "") or "",
        changed_parts=satir.get("boya_degisen", "") or "",
        for_trade=temizle_bool(satir.get("takasa_uygun"), "uygun"),
        from_whom=satir.get("kimden", "") or "",
        tramer=temizle_ondalik(satir.get("tramer")),
    )


def ev_satirini_isle(satir):
    return HouseListing(
        location=satir.get("konum", "") or "",
        price=temizle_sayi(satir.get("fiyat")) or 0,
        listing_date=temizle_tarih(satir.get("ilan_tarihi")),
        meter_squared=temizle_sayi(satir.get("metrekare")),
        building_aged=satir.get("bina_yasi", "") or "",
        number_of_floors=temizle_sayi(satir.get("toplam_kat_sayisi")),
        number_of_rooms=satir.get("oda_sayisi", "") or "",
        floor=satir.get("bulundugu_kat", "") or "",
        credit_eligibility=temizle_bool(satir.get("kredi_uygunlugu"), "uygun"),
    )


class Command(BaseCommand):
    help = "CSV'den araba ya da ev ilanlarını topluca içeri aktarır"

    def add_arguments(self, parser):
        parser.add_argument("tur", choices=["araba", "ev"])
        parser.add_argument("csv_yolu")

    def handle(self, *args, **options):
        tur = options["tur"]
        csv_yolu = options["csv_yolu"]

        satir_isleyici = araba_satirini_isle if tur == "araba" else ev_satirini_isle

        try:
            with open(csv_yolu, encoding="utf-8") as f:
                okuyucu = csv.DictReader(f)
                nesneler = [satir_isleyici(satir) for satir in okuyucu]
        except FileNotFoundError:
            raise CommandError(f"Dosya bulunamadı: {csv_yolu}")

        if not nesneler:
            self.stdout.write(self.style.WARNING(
                "CSV boş, yazılacak kayıt yok."))
            return

        # NOT: multi-table inheritance kullanan modellerde (CarListing/HouseListing
        # Listing'den türediği için) bulk_create desteklenmiyor
        # ("Can't bulk create a multi-table inherited model" hatası verir).
        # Bu yüzden tek tek save() çağırıyoruz, transaction.atomic() ile
        # sarmalayarak hepsi tek bir işlemde commit edilsin diye hız kazanıyoruz.
        with transaction.atomic():
            for nesne in nesneler:
                nesne.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(nesneler)} adet {tur} ilanı içeri aktarıldı.")
        )
