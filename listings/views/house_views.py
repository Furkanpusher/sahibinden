from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework import status
from listings.models import HouseListing
from listings.serializers import ListingSerializer, HouseListingSerializer
from listings.permissions import IsOwnerOrReadOnly
from ..services import (get_all_houses, filter_houses, get_house_by_id, 
                        get_house_filter_options, create_listing, delete_listing, update_listing)

class HouseListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    # ev kategorisine girince
    def get(self, request):
        if request.query_params:
            houses = filter_houses(**request.query_params.dict())
        else:
            houses = get_all_houses()
        serializer = HouseListingSerializer(houses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = HouseListingSerializer(data=request.data)
        if serializer.is_valid():
            house = create_listing(HouseListing, user=request.user, data=serializer.validated_data)
            return Response(HouseListingSerializer(house).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HouseDetailView(APIView): 
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
     # başta initial --> self.get_permissions() fakat bizim get_permissions() olmadığı için ata sınıf yani APIViewdaki get_permissions çalışır
     # ve onda da  return [permission() for permission in self.permission_classes] bu satır olduğu için permission classes böyle kullanılır

    def dispatch(self, request, *args, **kwargs):
        pk = kwargs.get("pk") # sürekli çekmemek için
        self.house = get_house_by_id(pk)
        return super().dispatch(request, *args, **kwargs) # root dispatch devam



    def get(self, request, pk):

        serializer = HouseListingSerializer(self.house)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        self.check_object_permissions(request, self.house)
        updated_house, errors = update_listing(self.house, HouseListingSerializer, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(HouseListingSerializer(updated_house).data, status=status.HTTP_200_OK)


    def delete(self, request, pk):
        self.check_object_permissions(request, self.house) # üstteki permission_classes dan alır
        delete_listing(user=request.user, pk=pk)
        return Response({"detail": "Ev ilanı başarıyla silindi."}, status=status.HTTP_200_OK)


class HouseFilterOptionsView(APIView):
    def get(self, request):
        selected_city = request.query_params.get("city")
        # sözlükten city yi çekiyoruz
        options = get_house_filter_options(selected_city=selected_city)
        return Response(options, status=200)


