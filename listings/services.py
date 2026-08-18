from django.core.exceptions import ValidationError
from django.conf import global_settings
from listings.models import Listing, CarListing, HouseListing, Favorite, Report, ListingImage
from django.shortcuts import get_object_or_404
from django.db import models   
from django.core.exceptions import PermissionDenied

# genel listing fonksiyonellikleri burada yazılacak
# add_listing, update_listing, delete_listing vb



""" BASİT GET METODLARI """

# Tüm arabaları alır
def get_all_cars():
    return CarListing.objects.select_related("listing_owner").all().order_by("-id")


# Tüm evleri alır
def get_all_houses(): 
    return HouseListing.objects.select_related("listing_owner").all()


def get_car_by_id(pk):
    return get_object_or_404(CarListing, pk=pk)

def get_house_by_id(pk):
    return get_object_or_404(HouseListing, pk=pk)



""" FİLTRELEME VE DROPDOWN FONKSİYONLARI """

# Arabaları filtreleme mantığı
def filter_cars(**filtreler):  # ** --> gelen query parametrelerini sözlük haline getiriyor 

#    django filter backend

    qs = CarListing.objects.select_related("listing_owner").all()
    # select_related() ensures that the related object is fetched together with the main object.
    # This reduces the number of database queries from N+1 to 1. 
    # django query sets works lazy so it doesn't go to database first it links all the queries and then goes once.
    # only when you want to use that data with serializer, only then goes and take the data.

    if filtreler.get("brand"): # o keyin value'sini çekiyor  {brand: "Renault"}
        # marka
        qs = qs.filter(brand__exact=filtreler["brand"])

    if filtreler.get("transmission_type"): 
        # vites tipi
        qs = qs.filter(transmission_type=filtreler["transmission_type"])

    if filtreler.get("price_min"):
        # minimum fiyat
        qs = qs.filter(price__gte=filtreler["price_min"])

    if filtreler.get("price_max"):
        # maximum fiyat
        qs = qs.filter(price__lte=filtreler["price_max"])

    if filtreler.get("city"):
        # eşleşen şehir
        qs = qs.filter(city__iexact=filtreler["city"])

    if filtreler.get("district"):
        # semt
        qs = qs.filter(district__iexact=filtreler["district"])


    return qs


# Evleri filtreleme mantığı
def filter_houses(**filtreler):
    qs = HouseListing.objects.all()
   
    if filtreler.get("meter_squared"):
        # metrekare
        qs = qs.filter(meter_squared__gte=filtreler["meter_squared"])

    if filtreler.get("number_of_rooms"):
        # oda sayısı
        qs = qs.filter(number_of_rooms=filtreler["number_of_rooms"])

    if filtreler.get("building_aged"):
        # bina yaşı
        qs = qs.filter(building_aged=filtreler["building_aged"])

    if filtreler.get("floor"):
        # kat
        qs = qs.filter(floor=filtreler["floor"])

    if filtreler.get("price_min"):
        # minimum fiyat
        qs = qs.filter(price__gte=filtreler["price_min"])

    if filtreler.get("price_max"):
        # maximum fiyat
        qs = qs.filter(price__lte=filtreler["price_max"])

    if filtreler.get("city"):
        qs = qs.filter(city__iexact=filtreler["city"])

    if filtreler.get("district"):
        qs = qs.filter(district__iexact=filtreler["district"])

    return qs


# ARABA DROPDOWN (Kademeli / Dinamik Filtreleme)
def get_car_filter_options(selected_city=None, selected_brand=None, selected_transmission=None):
    base_qs = CarListing.objects.all()

    # Şehirler: Seçili marka veya vites varsa filtrele (fakat şehir filtresi uygulama)
    cities_filter = {}
    if selected_brand:
        cities_filter["brand__exact"] = selected_brand
    if selected_transmission:
        cities_filter["transmission_type"] = selected_transmission
    cities_qs = base_qs.filter(**cities_filter).values("city").annotate(count=models.Count("id")).order_by("city")
    cities = [{"name": item["city"], "count": item["count"]} for item in cities_qs if item["city"]]
    
    # Markalar: Seçili şehir veya vites varsa filtrele (fakat marka filtresi uygulama)
    brands_filter = {}
    if selected_city:
        brands_filter["city__iexact"] = selected_city
    if selected_transmission:
        brands_filter["transmission_type"] = selected_transmission
    brands_qs = base_qs.filter(**brands_filter).values("brand").annotate(count=models.Count("id")).order_by("brand")
    brands = [{"name": item["brand"], "count": item["count"]} for item in brands_qs if item["brand"]]
    
    # Vites Tipleri: Seçili şehir veya marka varsa filtrele (fakat vites filtresi uygulama)
    transmissions_filter = {}
    if selected_city:
        transmissions_filter["city__iexact"] = selected_city
    if selected_brand:
        transmissions_filter["brand__exact"] = selected_brand
    transmissions_qs = base_qs.filter(**transmissions_filter).values("transmission_type").annotate(count=models.Count("id")).order_by("transmission_type")
    transmissions = [{"name": item["transmission_type"], "count": item["count"]} for item in transmissions_qs if item["transmission_type"]]
    
    options = {
        "cities": cities,
        "brands": brands,
        "transmissions": transmissions,
        "districts": [] 
    }
    
    # İlçeler: Seçili şehir zorunlu, marka ve vites de varsa filtrele
    if selected_city:
        districts_filter = {"city__iexact": selected_city}
        if selected_brand:
            districts_filter["brand__exact"] = selected_brand
        if selected_transmission:
            districts_filter["transmission_type"] = selected_transmission
        districts_qs = base_qs.filter(**districts_filter).values("district").annotate(count=models.Count("id")).order_by("district")
        options["districts"] = [{"name": item["district"], "count": item["count"]} for item in districts_qs if item["district"]]
    return options



# HOUSE DROPDOWN (Kademeli / Dinamik Filtreleme)
def get_house_filter_options(selected_city=None, selected_number_of_rooms=None, selected_floor=None):
    base_qs = HouseListing.objects.all()

    # Şehirler: Seçili oda veya kat varsa filtrele
    cities_filter = {}
    if selected_number_of_rooms:
        cities_filter["number_of_rooms"] = selected_number_of_rooms
    if selected_floor:
        cities_filter["floor"] = selected_floor
    cities_qs = base_qs.filter(**cities_filter).values("city").annotate(count=models.Count("id")).order_by("city")
    cities = [{"name": item["city"], "count": item["count"]} for item in cities_qs if item["city"]]
    
    # Oda Sayıları: Seçili şehir veya kat varsa filtrele
    rooms_filter = {}
    if selected_city:
        rooms_filter["city__iexact"] = selected_city
    if selected_floor:
        rooms_filter["floor"] = selected_floor
    rooms_qs = base_qs.filter(**rooms_filter).values("number_of_rooms").annotate(count=models.Count("id")).order_by("number_of_rooms")
    number_of_rooms = [{"name": item["number_of_rooms"], "count": item["count"]} for item in rooms_qs if item["number_of_rooms"]]
    
    # Katlar: Seçili şehir veya oda sayısı varsa filtrele
    floors_filter = {}
    if selected_city:
        floors_filter["city__iexact"] = selected_city
    if selected_number_of_rooms:
        floors_filter["number_of_rooms"] = selected_number_of_rooms
    floors_qs = base_qs.filter(**floors_filter).values("floor").annotate(count=models.Count("id")).order_by("floor")
    floors = [{"name": item["floor"], "count": item["count"]} for item in floors_qs if item["floor"]]
    
    options = {
        "cities": cities,
        "number_of_rooms": number_of_rooms,
        "floors": floors,
        "districts": [],
    }
    
    # İlçeler: Seçili şehir ve diğer parametrelerle filtrele
    if selected_city:
        districts_filter = {"city__iexact": selected_city}
        if selected_number_of_rooms:
            districts_filter["number_of_rooms"] = selected_number_of_rooms
        if selected_floor:
            districts_filter["floor"] = selected_floor
        districts_qs = base_qs.filter(**districts_filter).values("district").annotate(count=models.Count("id")).order_by("district")
        options["districts"] = [{"name": item["district"], "count": item["count"]} for item in districts_qs if item["district"]]
  
    return options



# İLAN CRUD İŞLEMLERİ

def create_listing(model_class, user, data):
    # İlan oluşturma
    listing = model_class.objects.create(listing_owner=user, **data)
    return listing


def delete_listing(user, pk):
    # ilan silme
    listing = get_object_or_404(Listing, pk=pk)
    if listing.listing_owner != user:
        raise PermissionDenied("Sadece kendi ilanınızı silebilirsiniz.")
    listing.delete()


def update_listing(instance, serializer_class, data, partial=True):
    # ilan güncelleme
    serializer = serializer_class(instance, data=data, partial=partial) # instance mevcut obje, data yeni obje
    if serializer.is_valid():
        updated_instance = serializer.save()
        return updated_instance, None
    return None, serializer.errors



# Favoriler

def toggle_favorite(user, pk):
    listing = get_object_or_404(Listing, pk=pk)
    
    
    favorite, created = Favorite.objects.get_or_create(user = user, listing = listing) 
    # aynı parametreler ile aynı obje db de oluşturulmasın diye bu fonksiyon kullanılıyor, obje ve created bool returnlüyor ordan anlıyoruz

    if not created: # zaten eklenmiş bir daha basarsa silinir
        favorite.delete()
        return False
    return True


def get_user_favorites(user):
    # usera ait favoriler döner
    return Favorite.objects.filter(user=user).select_related("listing")





# Reports

def report_listing(user, pk, description=""):
    listing = get_object_or_404(Listing, pk = pk)

    if listing.listing_owner == user: # kendi ilanını reportlayamaz
        raise PermissionDenied("Kendi ilanını şikayet edemezsin")

    if Report.objects.filter(user = user, listing = listing).exists(): # zten bu unique report varsa bir daha edemez
        raise ValidationError("Bu ilanı zaten şikayet ettin")

    report = Report.objects.create( # report oluştur
        user = user,
        listing = listing,
        description = description # blank olabilir
    )
    return report
    
def get_user_reports(user):
    return Report.objects.filter(user=user).select_related("listing")

def get_all_reports():
    return Report.objects.all().order_by("-report_date").select_related("listing")



# List Images

def add_images_to_listing(listing, image_files, is_cover=False):
    created_images = []
    for image_file in image_files:
        img_obj = ListingImage.objects.create(
            listing=listing,
            image=image_file,
            is_cover=is_cover
        )
        created_images.append(img_obj)
    return created_images
