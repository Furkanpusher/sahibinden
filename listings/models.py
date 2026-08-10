from django.db import models
from django.conf import settings # kendi settingsim ile django conf ikisinide alır

# Create your models here.

class Listing(models.Model): # Tüm ilan türlerindeki ortak bilgiler burda, tekrar etmemesi çin iyi
    baslik = models.CharField(max_length = 250)
    konum = models.CharField(max_length = 250)
    fiyat = models.DecimalField(max_digits = 12, decimal_places = 2) # 100 milyar ...
    ilan_tarihi = models.DateField(null = True, blank = True)

    sahibi = models.ForeignKey( # bi user olmalı
        settings.AUTH_USER_MODEL, # sonra değiştirmek istersek diye en iyi practice bu
        on_delete = models.CASCADE,
        related_name = 'ilanlar', # user modelinden listinge kolay erişim
        null = True,
        blank = True,
    )

    #NOT: Blank --> doğrulama / form katmanında çalışıyor
    #     Null --> Veritabanı katmanında çalışır

    olusturulma_tarihi = models.DateTimeField(auto_now_add = True)
    guncellenme_tarihi = models.DateTimeField(auto_now = True)

    class Meta: # modelin veritabanında nasıl çalıştığını kontrol eder formatlama ile alakalı
        ordering = ["-olusturulma_tarihi"] # enyenilerden göstercek - sayesinde

    def __str__(self):
        return self.baslik or f"İlan #{self.pk}"


class CarListing(Listing):
    VITES_SECENEKLERI = [ # 3seçenek
        ("manuel", "Manuel"),
        ("otomatik", "Otomatik"),
        ("yari_otomatik", "Yarı otomatik"),
        ]


    marka = models.CharField(max_length = 100)
    seri = models.CharField(max_length = 100, blank = True)
    model = models.CharField(max_length = 100)
    yil = models.PositiveIntegerField(null = True, blank = True) # 2022
    kilometre = models.PositiveIntegerField(null = True, blank = True)
    vites_tipi = models.CharField(
        max_length=20, choices=VITES_SECENEKLERI, blank=True
    )
    yakit_tipi = models.CharField(max_length=50, blank=True)
    kasa_tipi = models.CharField(max_length=50, blank=True)
    renk = models.CharField(max_length=50, blank=True)
    motor_hacmi = models.CharField(max_length=50, blank=True)
    motor_gucu = models.CharField(max_length=50, blank=True)
    cekis = models.CharField(max_length=50, blank=True)
    arac_durumu = models.CharField(max_length=100, blank=True)
    ortalama_yakit_tuketimi = models.CharField(max_length=50, blank=True)
    yakit_deposu = models.CharField(max_length=50, blank=True)
    boya_degisen = models.CharField(max_length=100, blank=True)
    takasa_uygun = models.BooleanField(null=True, blank=True)
    kimden = models.CharField(max_length=50, blank=True)
    tramer = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
 
    class Meta:
        verbose_name = "Araç İlanı"
        verbose_name_plural = "Araç İlanları"
 
    def __str__(self):
        return self.baslik or f"{self.marka} {self.model}"



class HouseListing(Listing): # Ev listelemeleri
    metrekare = models.PositiveIntegerField(null=True, blank=True)
    bina_yasi = models.CharField(max_length=50, blank=True)
    toplam_kat_sayisi = models.PositiveIntegerField(null=True, blank=True)
    oda_sayisi = models.CharField(max_length=20, blank=True)
    bulundugu_kat = models.CharField(max_length=20, blank=True)
    kredi_uygunlugu = models.BooleanField(null=True, blank=True)
 
    class Meta:
        verbose_name = "Ev İlanı"
        verbose_name_plural = "Ev İlanları"
 
    def __str__(self):
        return self.baslik or f"{self.oda_sayisi} - {self.konum}"