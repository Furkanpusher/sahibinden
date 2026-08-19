from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework import status
from listings.models import HouseListing
from listings.serializers import HouseListingSerializer
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
     # First initial --> self.get_permissions(), but since we don't have get_permissions(), the ancestor class, namely get_permissions in APIView, works.
     # and since there is this line return [permission() for permission in self.permission_classes] permission classes are used like this


    def dispatch(self, request, *args, **kwargs): # not vital but good for avoiding code repetition
        pk = kwargs.get("pk") 
        self.house = get_house_by_id(pk)
        return super().dispatch(request, *args, **kwargs) # root dispatch contunies



    def get(self, request, pk): # get the house

        serializer = HouseListingSerializer(self.house)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk): # update the house
        self.check_object_permissions(request, self.house)
        updated_house, errors = update_listing(self.house, HouseListingSerializer, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(HouseListingSerializer(updated_house).data, status=status.HTTP_200_OK)


    def delete(self, request, pk): # delete the house
        self.check_object_permissions(request, self.house) 
        delete_listing(user=request.user, pk=pk)
        return Response({"detail": "Ev ilanı başarıyla silindi."}, status=status.HTTP_200_OK)


class HouseFilterOptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        selected_city = request.query_params.get("city")
        selected_rooms = request.query_params.get("number_of_rooms")
        selected_floor = request.query_params.get("floor")

        options = get_house_filter_options(
            selected_city=selected_city,
            selected_number_of_rooms=selected_rooms,
            selected_floor=selected_floor
        )
    
    #      "cities": [
    #     {"name": "Ankara", "count": 14},
    #     {"name": "İstanbul", "count": 42},
    #     {"name": "İzmir", "count": 20}
    # ],
    # "number_of_rooms": [
    #     {"name": "1+1", "count": 10},
    #     {"name": "2+1", "count": 35},
    #     {"name": "3+1", "count": 28}
    # ],
    # "floors": [
    #     {"name": "1. Kat", "count": 15},
    #     {"name": "3. Kat", "count": 22}
    # ],
    # "districts": [ 
    #     {"name": "Beşiktaş", "count": 12},
    #     {"name": "Kadıköy", "count": 18},
    #     {"name": "Şişli", "count": 12}
    # ]

        return Response(options, status=status.HTTP_200_OK)


