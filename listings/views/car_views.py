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


    # because get_permissions() in view return [permission() for permission in self.permission_classes]
    
    # for each item in permission_classes, get_permissions() creates an object instance of it.
    

    def get(self, request):
        if request.query_params:
            cars = filter_cars(**request.query_params.dict())
        else:
            cars = get_all_cars()
        serializer = CarListingSerializer(cars, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request): # İlan ekleme
        serializer = CarListingSerializer(data=request.data) 
        # list sahibi post ile gönderilmiyor o yüzden serializer json üzerinden alıyoruz
        
        
        if serializer.is_valid():
            car = create_listing(CarListing, user=request.user, data=serializer.validated_data)
            return Response(CarListingSerializer(car).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CarDetailView(APIView):
    
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]


    # permission_classes work as 

    # user is authenticated, or is a read-only request.

    def dispatch(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        self.car = get_car_by_id(pk)
        return super().dispatch(request, *args, **kwargs) # root dispatch continues


    def get(self, request, pk):
        serializer = CarListingSerializer(self.car)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def put(self, request, pk): # ilan güncelleme
        self.check_object_permissions(request, self.car) # is he the owner?
        
        # does for permission in self.get_permissions():
        #   permission.has_object_permission(request, self, self.car)

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
        selected_city = request.query_params.get("city")
        selected_brand = request.query_params.get("brand")
        selected_transmission = request.query_params.get("transmission_type")
        
        options = get_car_filter_options(
            selected_city=selected_city,
            selected_brand=selected_brand,
            selected_transmission=selected_transmission
        )
        return Response(options, status=status.HTTP_200_OK)