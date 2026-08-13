from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from listings.serializers import CarListingSerializer
from ..services import get_all_cars, filter_cars, get_car_by_id, get_car_filter_options, create_car_listing


class CarListingView(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]  # ilan oluşturmak için login şart
        return [AllowAny()]    # genel listeleri herkes görebilir sadece post da yani list oluşturuken falan izin lazım

    def get(self, request):
        # tüm arabaları listele (filtre varsa filtreleyerek)
        if request.query_params:
            cars = filter_cars(**request.query_params.dict())
        else:
            cars = get_all_cars()
        serializer = CarListingSerializer(cars, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        print("--- CarListingView POST isteği geldi ---")
        print("Authorization Header:", request.headers.get("Authorization"))
        print("Request User:", request.user)
        print("Request Auth:", request.auth)
        print("Gelen Data:", request.data)

        # sadece giriş yaptıysan liste oluşturabiliyorsun
        serializer = CarListingSerializer(data=request.data)
        if serializer.is_valid():
            car = create_car_listing(user=request.user, data=serializer.validated_data)
            return Response(CarListingSerializer(car).data, status=status.HTTP_201_CREATED)
        print("Serializer Hataları:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CarDetailView(APIView):

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]         # detay sayfasını herkes görebilir
        return [IsAuthenticated()]      # PUT, DELETE için login şart

    def get(self, request, pk):
        car = get_car_by_id(pk)
        serializer = CarListingSerializer(car)
        return Response(serializer.data, status=200)

    def put(self, request, pk):
        # ilan güncelleme — sadece ilan sahibi yapabilmeli
        pass

    def delete(self, request, pk):
        # ilan silme — sadece ilan sahibi yapabilmeli
        pass


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