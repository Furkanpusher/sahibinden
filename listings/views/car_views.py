from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from listings.serializers import CarListingSerializer
from ..services import (get_all_cars, filter_cars, get_car_by_id, get_car_filter_options,
                        create_car_listing, delete_car_listing)


class CarListingView(APIView):

    def get_permissions(self):
        # Sadece POST işlemi yaparken (ilan eklerken) JWT Token isteyecek
        if self.request.method == "POST":
            return [IsAuthenticated()]  
        # Diğer durumlarda (GET - listeleme) herkes görebilir
        return [AllowAny()]    

    def get(self, request):
        if request.query_params:
            cars = filter_cars(**request.query_params.dict())
        else:
            cars = get_all_cars()
        serializer = CarListingSerializer(cars, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request): # İlan ekleme ana sayfadan yapılabilir
        serializer = CarListingSerializer(data=request.data)
        
        if serializer.is_valid():
            # Artık token doğru okunduğu için request.user 'Anonim' DEĞİL, senin giriş yaptığın hesap olacak!
            car = create_car_listing(user=request.user, data=serializer.validated_data)
            return Response(CarListingSerializer(car).data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

   




class CarDetailView(APIView):

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]         # detay sayfasını herkes görebilir
        return [IsAuthenticated()]      # PUT, DELETE için login şart

    def get(self, request, pk):
        car = get_car_by_id(pk)
        serializer = CarListingSerializer(car)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        # ilan güncelleme — sadece ilan sahibi yapabilmeli
        pass

    def delete(self, request, pk):  # İlan silme
        delete_car_listing(user = request.user, pk = pk)


class CarFilterOptionsView(APIView):
    # ÇÖZÜM BURASI: Filtre seçeneklerini (markalar, şehirler vb.) herkesin 
    # token olmadan çekebilmesi için AllowAny ekledik.
    permission_classes = [AllowAny]

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
        return Response(options, status=status.HTTP_200_OK)