from rest_framework.response import Response
from .services import (
    get_all_listings, get_all_cars, filter_cars, get_all_houses, filter_houses, 
    get_car_by_id, get_house_by_id, get_car_filter_options, get_house_filter_options
)
from .serializers import ListingSerializer, CarListingSerializer, HouseListingSerializer
from rest_framework.views import APIView

# Create your views here.

class MainListingView(APIView):
    # Tüm ilanları göster
    def get(self, request):
        listings = get_all_listings()
        serializer = ListingSerializer(listings, many = True)
        return Response(serializer.data, status = 200)


class CarListingView(APIView): 
    def get(self, request): 
        # araba kategorisine girince tüm arabaları görsün ama filtreleme fnoksiyonu da çalışsın
        if request.query_params:
            cars = filter_cars(**request.query_params.dict())
        else:
            cars = get_all_cars()
        serializer = CarListingSerializer(cars, many = True)
        return Response(serializer.data, status = 200)


class HouseListView(APIView):
    # ev kategorsiine girince
    def get(self, request):
        if request.query_params:
            houses = filter_houses(**request.query_params.dict())
        else:
            houses = get_all_houses()
        serializer = HouseListingSerializer(houses, many = True)
        return Response(serializer.data, status = 200)


class CarDetailView(APIView):
    def get(self, request, pk):
        print("CarDetailView get metodu çalıştı")
        # pk sı ile bulucak yani id
        car = get_car_by_id(pk)
        serializer = CarListingSerializer(car)
        return Response(serializer.data, status=200)


class HouseDetailView(APIView):
    def get(self, request, pk):
        house = get_house_by_id(pk)
        serializer = HouseListingSerializer(house)
        return Response(serializer.data, status=200)



""" TAMAMEN DROPDOWNLARI DOLDURMAK İÇİN VİEWLAR """


class CarFilterOptionsView(APIView):
    def get(self, request):
        # URL'den seçilen şehri parametre olarak alıyorum (Örn: ?city=Ankara)
        selected_city = request.query_params.get("city")
        
        options = get_car_filter_options(selected_city=selected_city)

        # buraya retrun olan option şu tipte 
        # { 
        #   "cities": ["İstanbul", "Ankara", "İzmir"],
        #   "brands": ["Renault", "Ford", "Volkswagen"],
        #   "transmissions": ["Manuel", "Otomatik"],
        #   "districts": ["Kadıköy", "Beşiktaş", "Şişli"]
        # }
        
        # Hazırlanan seçenekler sözlüğünü JSON olarak frontend'e dönüyoruz
        return Response(options, status=200)

class HouseFilterOptionsView(APIView):
    def get(self, request):
        selected_city = request.query_params.get("city")
        # sözlükten city yi çekiyoruz
        options = get_house_filter_options(selected_city=selected_city)
        return Response(options, status=200)