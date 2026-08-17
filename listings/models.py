from django.db import models
from django.conf import settings # kendi settingsim ile django conf ikisinide alır

# Create your models here.

class Listing(models.Model): # Tüm ilan türlerindeki ortak bilgiler burda, tekrar etmemesi çin iyi
    title = models.CharField(max_length = 250, default = "")

    # arabalarda şehir olarak evlerde semt olarak geçiyor verisetinde
    # location = models.CharField(max_length = 250, default = "") gerek kalmadı artık city, distrcite geçtik

    city = models.CharField(max_length = 250, default = "", blank = True, db_index = True)
    district = models.CharField(max_length = 250, default = "", blank= True, db_index = True) # migrationda hata vermemesi için ""


    # WHERE, JOIN veya ORDER BY gibi sorgu işlemlerinde kullanılacaksa db_index=True yapmak lazım
    price = models.DecimalField(max_digits = 12, decimal_places = 2, default = 0) # 100 milyar ...
    listing_date = models.DateField(null = True, blank = True)

    listing_owner = models.ForeignKey( # bi user olmalı
    
        settings.AUTH_USER_MODEL, # CustomUser
        on_delete = models.CASCADE, # user silinince ilanları silinmeli 
        related_name = 'ilanlar', # reverse ilişki için mesela user.ilanlar() diyebilirim
        # select * from listings where user_id = 1 yerine user.ilanlar() derim.

         null = False,  #her ilanın 1 ownerı olmalı!
        blank = False, 

    )




    #NOT: Blank --> doğrulama / form katmanında çalışıyor
    #     Null --> Veritabanı katmanında çalışır

    listing_update = models.DateTimeField(auto_now = True)

    class Meta: # modelin veritabanında nasıl çalıştığını kontrol eder formatlama ile alakalı
        ordering = ["-listing_date"] # enyenilerden göstercek - sayesinde

    def __str__(self):
        return self.title or f"İlan #{self.pk}"


class CarListing(Listing):

    # listing_ptr adlı bir tablo oluşuyor bu inheritten sonra
    # carlisting gösterirken hep önce listing sorgusundan sonra join yapıyor
    # yani önce ortak bilgileri listing'den sonra da ek bilgileri alcak

    # listing_ptr_id sütunu oluştu artık ve 2 tablo idleri 1-1 ilişki var.

    TRANSMISSION_OPTIONS = [ # 3seçenek
        ("manuel", "Manuel"),
        ("otomatik", "Otomatik"),
        ("yarı otomatik", "Yarı Otomatik"),
        ]


    brand = models.CharField(max_length = 100, default = "")
    series = models.CharField(max_length = 100, blank = True)
    model = models.CharField(max_length = 100, default = "")
    year = models.PositiveIntegerField(null = True, blank = True) # 2022
    km = models.PositiveIntegerField(null = True, blank = True)
    transmission_type = models.CharField(
        max_length=20, choices= TRANSMISSION_OPTIONS, blank=True
    )
    fuel_type = models.CharField(max_length=50, blank=True)
    body_type = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    engine_size = models.CharField(max_length=50, blank=True)
    engine_power = models.CharField(max_length=50, blank=True)
    traction = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=100, blank=True)
    avg_fuel_consumption = models.CharField(max_length=50, blank=True)
    fuel_tank = models.CharField(max_length=50, blank=True)
    changed_parts = models.CharField(max_length=100, blank=True)
    for_trade = models.BooleanField(null=True, blank=True)
    from_whom = models.CharField(max_length=50, blank=True)
    tramer = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
 
    class Meta:
        verbose_name = "Araç İlanı"
        verbose_name_plural = "Araç İlanları"
 
    def __str__(self):
        return self.title or f"{self.brand} {self.model}"



class HouseListing(Listing): # Ev listelemeleri
    meter_squared = models.PositiveIntegerField(null=True, blank=True)
    building_aged = models.CharField(max_length=50, blank=True)
    number_of_floors = models.PositiveIntegerField(null=True, blank=True)
    number_of_rooms = models.CharField(max_length=20, blank=True)
    floor = models.CharField(max_length=20, blank=True)
    credit_eligibility = models.BooleanField(null=True, blank=True)
 
    class Meta:
        verbose_name = "Ev İlanı"
        verbose_name_plural = "Ev İlanları"
 
    def __str__(self):
        return self.title or f"{self.number_of_rooms} - {self.city}"


# favorites --> list_id user_id (user favori görüp silebilmeli) (ilanı silince favoriden de silinmeli)
# reported --> listing base class eklenebilir


class Favorite(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name = "favorited_by") # ilan kaldırılırsa favorilerden de silincek
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name = "favorites") # user kaldırılırsa favorilerden silincek
    created_at = models.DateTimeField(auto_now_add = True)
    
    class Meta: # modelimiz için bir config dosyası gibi, metadaatayı güncellemek için 
        unique_together = ("listing", "user") # aynı kullanıcı ilanı 2 kez favorileyemesin 
        ordering = ["-created_at"] # en son favoriler başa düşcek
    
    def __str__(self):
        return f"{self.user} - {self.listing.title}"
       

  
     
class Report(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="reports")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name = "reports")
    report_date = models.DateTimeField(auto_now_add = True) 
    description = models.TextField()

    class Meta: 
        unique_together = ("listing", "user") # 1 liste 1 kere reportlanabilir aynı kullanıcı tarafından
        ordering = ["-report_date"] # en son reportlanan başa düşcek


    
