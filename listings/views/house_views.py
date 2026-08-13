from rest_framework.views import APIView
from rest_framework.response import Response
from listings.serializers import ListingSerializer, HouseListingSerializer
from ..services import get_all_listings, get_all_houses, filter_houses, get_house_by_id, get_house_filter_options

class HouseListView(APIView):
    # ev kategorsiine girince
    def get(self, request):
        if request.query_params:
            houses = filter_houses(**request.query_params.dict())
        else:
            houses = get_all_houses()
        serializer = HouseListingSerializer(houses, many = True)
        return Response(serializer.data, status = 200)


class HouseDetailView(APIView):
    def get(self, request, pk):
        house = get_house_by_id(pk)
        serializer = HouseListingSerializer(house)
        return Response(serializer.data, status=200)

class HouseFilterOptionsView(APIView):
    def get(self, request):
        selected_city = request.query_params.get("city")
        # sözlükten city yi çekiyoruz
        options = get_house_filter_options(selected_city=selected_city)
        return Response(options, status=200)


class MainListingView(APIView):
    # Tüm ilanları göster
    def get(self, request):
        listings = get_all_listings()
        serializer = ListingSerializer(listings, many=True)
        return Response(serializer.data, status=200)
