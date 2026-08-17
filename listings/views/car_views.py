from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework import status
from listings.models import CarListing
from listings.serializers import CarListingSerializer
from listings.permissions import IsOwnerOrReadOnly
from ..services import (get_all_cars, filter_cars, get_car_by_id, get_car_filter_options,
                        create_listing, delete_listing, update_listing)


class CarListingView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        if request.query_params:
            cars = filter_cars(**request.query_params.dict())
        else:
            cars = get_all_cars()
        serializer = CarListingSerializer(cars, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request): # İlan ekleme
        serializer = CarListingSerializer(data=request.data) 
        
        if serializer.is_valid():
            car = create_listing(CarListing, user=request.user, data=serializer.validated_data)
            return Response(CarListingSerializer(car).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CarDetailView(APIView):
    
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def dispatch(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        self.car = get_car_by_id(pk)
        return super().dispatch(request, *args, **kwargs) # asıl dispatch devam ediyor


    def get(self, request, pk):
        serializer = CarListingSerializer(self.car)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def put(self, request, pk):
        self.check_object_permissions(request, self.car)  # Yetki kontrolü (IsOwnerOrReadOnly)
        updated_car, errors = update_listing(self.car, CarListingSerializer, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(CarListingSerializer(updated_car).data, status=status.HTTP_200_OK)


    def delete(self, request, pk):  # İlan silme 
        self.check_object_permissions(request, self.car)  # Permission kontrolü
        delete_listing(user=request.user, pk=pk)
        return Response({"detail": "İlan başarıyla silindi."}, status=status.HTTP_200_OK)



class CarFilterOptionsView(APIView):

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