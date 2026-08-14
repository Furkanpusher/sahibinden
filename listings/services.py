from listings.models import Listing, CarListing, HouseListing
from django.shortcuts import get_object_or_404
from django.db import models   
from django.core.exceptions import PermissionDenied

# genel listing fonksiyonellikleri burada yazılacak
# add_listing, update_listing, delete_listing vb



""" BASİT GET METODLARI """

# Ana sayfa için her şeyi döndürür
def get_all_listings():
    return Listing.objects.all()

# Tüm arabaları alır
def get_all_cars():
    return CarListing.objects.all()


# Tüm evleri alır
def get_all_houses(): 
    return HouseListing.objects.all()


def get_car_by_id(pk):
    return get_object_or_404(CarListing, pk=pk)

def get_house_by_id(pk):
    return get_object_or_404(HouseListing, pk=pk)



""" FİLTRELEME VE DROPDOWN FONKSİYONLARI """

# Arabaları filtreleme mantığı
def filter_cars(**filtreler):  # ** --> gelen query parametrelerini sözlük haline getiriyor 

    print("filter_cars fonksiyonu çalıştı")

    qs = CarListing.objects.all() # query set { sayı büyüyünce verimsiz}

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


# ARABA DROPDOWN
def get_car_filter_options(selected_city=None):
    # Şehirler
    cities_qs = CarListing.objects.values("city").annotate(count=models.Count("id")).order_by("city")
    cities = [{"name": item["city"], "count": item["count"]} for item in cities_qs if item["city"]]
    
    # Markalar
    brands_qs = CarListing.objects.values("brand").annotate(count=models.Count("id")).order_by("brand")
    brands = [{"name": item["brand"], "count": item["count"]} for item in brands_qs if item["brand"]]
    
    # Vites Tipleri
    transmissions_qs = CarListing.objects.values("transmission_type").annotate(count=models.Count("id")).order_by("transmission_type")
    transmissions = [{"name": item["transmission_type"], "count": item["count"]} for item in transmissions_qs if item["transmission_type"]]
    
    options = {
        "cities": cities,
        "brands": brands,
        "transmissions": transmissions,
        "districts": [] 
    }
    
    if selected_city:
        districts_qs = CarListing.objects.filter(city__iexact=selected_city).values("district").annotate(count=models.Count("id")).order_by("district")
        options["districts"] = [{"name": item["district"], "count": item["count"]} for item in districts_qs if item["district"]]
    return options



# house dropdown
def get_house_filter_options(selected_city=None):
    # Şehirler
    cities_qs = HouseListing.objects.values("city").annotate(count=models.Count("id")).order_by("city")
    cities = [{"name": item["city"], "count": item["count"]} for item in cities_qs if item["city"]]
    
    # Oda Sayıları (Veritabanından gerçek "1+1", "2+1" değerleri)
    rooms_qs = HouseListing.objects.values("number_of_rooms").annotate(count=models.Count("id")).order_by("number_of_rooms")
    number_of_rooms = [{"name": item["number_of_rooms"], "count": item["count"]} for item in rooms_qs if item["number_of_rooms"]]
    
    # Katlar (Veritabanından gerçek "1. Kat", "Düz Giriş" değerleri)
    floors_qs = HouseListing.objects.values("floor").annotate(count=models.Count("id")).order_by("floor")
    floors = [{"name": item["floor"], "count": item["count"]} for item in floors_qs if item["floor"]]
    
    options = {
        "cities": cities,
        "number_of_rooms": number_of_rooms,
        "floors": floors,
        "districts": [],
    }
    
    # Şehir seçildiyse ilçeleri getir
    if selected_city:
        districts_qs = HouseListing.objects.filter(city__iexact=selected_city).values("district").annotate(count=models.Count("id")).order_by("district")
        options["districts"] = [{"name": item["district"], "count": item["count"]} for item in districts_qs if item["district"]]
  
    return options


def create_listing(model_class, user, data):
    """Hem ev hem araba (tüm modeller) için ortak ilan oluşturma servisi"""
    listing = model_class.objects.create(listing_owner=user, **data)
    return listing


def delete_listing(user, pk):
    # silme ortak olabilir basitçe çünkü listing_owner kısımları ortak.
    listing = get_object_or_404(Listing, pk=pk)
    if listing.listing_owner != user:
        raise PermissionDenied("Sadece kendi ilanınızı silebilirsiniz.")
    listing.delete()


def update_listing(instance, serializer_class, data, partial=True):
    """Hem ev hem araba için ortak güncelleme servisi"""
    serializer = serializer_class(instance, data=data, partial=partial) # instance mevcut obje, data yeni obje
    if serializer.is_valid():
        updated_instance = serializer.save()
        return updated_instance, None
    return None, serializer.errors
