from rest_framework.views import APIView
from rest_framework.response import Response
from listings.serializers import CarListingSerializer
from ..services import get_all_cars, filter_cars, get_car_by_id, get_car_filter_options


class CarListingView(APIView): 
    def get(self, request): 
        # araba kategorisine girince tüm arabaları görsün ama filtreleme fnoksiyonu da çalışsın
        if request.query_params:
            cars = filter_cars(**request.query_params.dict())
        else:
            cars = get_all_cars()
        serializer = CarListingSerializer(cars, many = True)
        return Response(serializer.data, status = 200)


class CarDetailView(APIView):
    def get(self, request, pk):
        car = get_car_by_id(pk)
        serializer = CarListingSerializer(car)
        return Response(serializer.data, status=200)


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