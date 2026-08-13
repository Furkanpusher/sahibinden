from listings.models import Listing, CarListing, HouseListing
from django.shortcuts import get_object_or_404

# genel listing fonksiyonellikleri burada yazılacak
# add_listing, update_listing, delete_listing vb

# Ana sayfa için her şeyi döndürür
def get_all_listings():
    return Listing.objects.all()


# Tüm arabaları alır
def get_all_cars():
    return CarListing.objects.all()


# Tüm evleri alır
def get_all_houses(): 
    return HouseListing.objects.all()


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

    if filtreler.get("location"):
        # konum
        qs = qs.filter(location__icontains=filtreler["location"])

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

    if filtreler.get("location"):
        # konum
        qs = qs.filter(location__icontains=filtreler["location"])

    return qs



# şehir vb json var public, bide dropdowno lcak!



def get_car_by_id(pk):
    return get_object_or_404(CarListing, pk=pk)

def get_house_by_id(pk):
    return get_object_or_404(HouseListing, pk=pk)
