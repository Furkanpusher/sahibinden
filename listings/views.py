from rest_framework.response import Response
from .services import get_all_listings, get_all_cars, filter_cars, get_all_houses, filter_houses
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