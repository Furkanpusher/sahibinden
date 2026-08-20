from django.db import models
from django.conf import settings # kendi settingsim ile django conf ikisinide alır

# Create your models here.

class Listing(models.Model):# Common information for cars and house
    title = models.CharField(max_length = 250, default = "")


    city = models.CharField(max_length = 250, default = "", blank = True, db_index = True)
    district = models.CharField(max_length = 250, default = "", blank= True, db_index = True) 


    price = models.DecimalField(max_digits = 12, decimal_places = 2, default = 0)
    listing_date = models.DateField(null = True, blank = True)

    listing_owner = models.ForeignKey( 
    
        settings.AUTH_USER_MODEL, # CustomUser
        on_delete = models.CASCADE, 
        related_name = 'ilanlar', # reverse relationship
        # select * from listings where user_id = 1 yerine user.ilanlar() derim.

         null = False,  
        blank = False, 

    )
    
    image = models.ImageField(upload_to = "listings/images/%Y/%m/%d/", null = True, blank = True)



    listing_update = models.DateTimeField(auto_now = True)

    class Meta: 
        ordering = ["-listing_date"] 

    def __str__(self):
        return self.title or f"İlan #{self.pk}"


class CarListing(Listing):

    # A table named listing_ptr is created after this inherit
    # When showing carlisting, it always joins first after the listing query.
    # In other words, it will first receive the common information from the listing and then additional information.

    # The listing_ptr_id column is now created and there is a 1-1 relationship between 2 table ids.

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



class HouseListing(Listing): 
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


#many to many field
class Favorite(models.Model): 

    # for adding extra fields, I use the Favorite model instead of ManyToManyField

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name = "favorited_by") # ilan kaldırılırsa favorilerden de silincek
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name = "favorites") # user kaldırılırsa favorilerden silincek
    created_at = models.DateTimeField(auto_now_add = True)
    
    class Meta: # metaconfig for our model
        unique_together = ("listing", "user") 
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.user} - {self.listing.title}"
       

  
     
class Report(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="reports")
    # 1 To Many
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name = "reports")
    report_date = models.DateTimeField(auto_now_add = True) 
    description = models.TextField()

    class Meta: 
        unique_together = ("listing", "user") 
        ordering = ["-report_date"] 


    

class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete = models.CASCADE, related_name = "images")
    image = models.ImageField(upload_to = "listings/images/%Y/%m/%d/", null = True, blank = True)
    is_cover = models.BooleanField(default = False) #is it cover picture
    created_at = models.DateTimeField(auto_now_add = True)



