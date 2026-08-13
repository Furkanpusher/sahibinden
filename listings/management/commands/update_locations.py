import json
import os
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from listings.models import Listing, CarListing, HouseListing

def turkce_kucuk(metin):
    """Türkçe karakterleri düzgün şekilde küçük harfe çevirir."""
    if not metin:
        return ""
    metin = metin.replace("İ", "i").replace("I", "ı")
    return metin.lower()

def turkce_normalize(metin):
    """Türkçe harfleri ingilizce karakterlere çevirip kıyaslama kolaylığı sağlar.
    Örn: 'arnavutkoy' -> 'arnavutkoy', 'Arnavutköy' -> 'arnavutkoy'"""
    if not metin:
        return ""
    metin = turkce_kucuk(metin)
    donusum = {
        "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u"
    }
    for k, v in donusum.items():
        metin = metin.replace(k, v)
    return re.sub(r"[^\w]", "", metin)

def bas_harfleri_buyut(metin):
    """Örn: 'İSTANBUL' -> 'İstanbul', 'ALADAĞ' -> 'Aladağ'"""
    if not metin:
        return ""
    kelimeler = metin.split()
    sonuc = []
    for k in kelimeler:
        if not k:
            continue
        ilk = k[0].replace("i", "İ").replace("ı", "I").upper()
        kalan = turkce_kucuk(k[1:])
        sonuc.append(ilk + kalan)
    return " ".join(sonuc)

class Command(BaseCommand):
    help = "Mevcut location stringlerini il.json ve ilce.json kullanarak city ve district alanlarına aktarır."

    def handle(self, *args, **options):
        base_dir = settings.BASE_DIR
        
        # Olası json yolları
        il_yolu = os.path.join(base_dir, "Veriler", "ilanVerileri", "il.json")
        ilce_yolu = os.path.join(base_dir, "Veriler", "ilanVerileri", "ilce.json")

        if not os.path.exists(il_yolu):
            il_yolu = os.path.join(base_dir, "Veriler", "il.json")
        if not os.path.exists(ilce_yolu):
            ilce_yolu = os.path.join(base_dir, "Veriler", "ilce.json")

        self.stdout.write(f"il.json okunuyor: {il_yolu}")
        self.stdout.write(f"ilce.json okunuyor: {ilce_yolu}")

        with open(il_yolu, encoding="utf-8") as f:
            il_data = json.load(f)
        with open(ilce_yolu, encoding="utf-8") as f:
            ilce_data = json.load(f)

        # JSON içindeki table data dizisini bul
        il_dizisi = next((item["data"] for item in il_data if item.get("name") == "il"), [])
        if not il_dizisi and isinstance(il_data, list):
            il_dizisi = il_data[0].get("data", []) if "data" in il_data[0] else il_data

        ilce_dizisi = next((item["data"] for item in ilce_data if item.get("name") == "ilce"), [])
        if not ilce_dizisi and isinstance(ilce_data, list):
            ilce_dizisi = ilce_data[0].get("data", []) if "data" in ilce_data[0] else ilce_data

        # id -> sehir_adi eşleştirmesi
        il_map = {}
        for il_obj in il_dizisi:
            il_map[str(il_obj["id"])] = bas_harfleri_buyut(il_obj["name"])

        # normalize_ilce_adi -> (düzgün_ilce_adi, düzgün_sehir_adi)
        ilce_lookup = {}
        for ilce_obj in ilce_dizisi:
            sehir_adi = il_map.get(str(ilce_obj["il_id"]), "")
            ilce_adi_duzgun = bas_harfleri_buyut(ilce_obj["name"])
            norm_key = turkce_normalize(ilce_obj["name"])
            ilce_lookup[norm_key] = (ilce_adi_duzgun, sehir_adi)

        self.stdout.write(self.style.SUCCESS(f"{len(il_map)} İl, {len(ilce_lookup)} İlçe haritası yüklendi."))

        # 1. Ev İlanlarını Güncelle
        evler = HouseListing.objects.all()
        guncellenen_ev = 0

        with transaction.atomic():
            for ev in evler:
                if not ev.location:
                    continue
                
                raw_loc = ev.location.strip()
                norm_loc = turkce_normalize(raw_loc)

                if norm_loc in ilce_lookup:
                    ilce_adi, sehir_adi = ilce_lookup[norm_loc]
                    ev.district = ilce_adi
                    ev.city = sehir_adi
                    ev.save()
                    guncellenen_ev += 1
                else:
                    # Eşleşemediyse ham lokasyonu semt yap
                    ev.district = bas_harfleri_buyut(raw_loc)
                    ev.city = "İstanbul" # datasetindeki evler istanbul
                    ev.save()
                    guncellenen_ev += 1

        self.stdout.write(self.style.SUCCESS(f"{guncellenen_ev} adet Ev İlanı konum bilgileri güncellendi."))

        # 2. Araba İlanlarını Güncelle
        arabalar = CarListing.objects.all()
        guncellenen_araba = 0

        with transaction.atomic():
            for araba in arabalar:
                if not araba.location:
                    continue
                
                raw_loc = araba.location.strip()
                # Örn: "Yeşiloba Mh. Seyhan, Adana"
                if "," in raw_loc:
                    parcalar = raw_loc.split(",")
                    sehir_raw = parcalar[1].strip()
                    sol_raw = parcalar[0].strip()

                    # Virgülden öncesinin son kelimesi ilçe
                    sol_kelimeler = sol_raw.split()
                    ilce_raw = sol_kelimeler[-1] if sol_kelimeler else ""

                    araba.city = bas_harfleri_buyut(sehir_raw)
                    
                    # ilçe arama
                    norm_ilce = turkce_normalize(ilce_raw)
                    if norm_ilce in ilce_lookup:
                        araba.district = ilce_lookup[norm_ilce][0]
                    else:
                        araba.district = bas_harfleri_buyut(ilce_raw)

                    araba.save()
                    guncellenen_araba += 1
                else:
                    # Virgül yoksa doğrudan şehre/semte yaz
                    araba.city = bas_harfleri_buyut(raw_loc)
                    araba.save()
                    guncellenen_araba += 1

        self.stdout.write(self.style.SUCCESS(f"{guncellenen_araba} adet Araba İlanı konum bilgileri güncellendi."))
