from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from listings.permissions import IsOwnerOrReadOnly
from listings.serializers import MapSerializer
from listings.models import Listing
from listings.services.map_services import get_district_coordinates
from listings.services.search_services import search_car_listings, search_house_listings


class MapView(APIView):
    """
    for map view that shows all categories of listings
    everyone can view the map, and go to the detail pages.
    if q is used or it's a category search we'll use elastic search
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # get the category
        category = request.query_params.get("category")
        city = request.query_params.get("city")
        q = request.query_params.get("q")  # if it's through search query

        if category not in ("car", "house"):
            return Response({
                "detail": "Kategori seçimi zorunludur, Araba yada Ev seçiniz."
            }, status=status.HTTP_400_BAD_REQUEST)

        # no matter if it's a dropdown filter or a query search we use elastic search
        if category == "car":
            search_data = search_car_listings(q=q, city=city, page_size=150)
        elif category == "house":
            search_data = search_house_listings(q=q, city=city, page_size=150)

        results = search_data.get("results", [])
        # results have count, total, page, page_size, and results

        for item in results:
            # we add coords to the results
            coords = get_district_coordinates(
                item.get("city"), item.get("district"))
            item["coordinates"] = coords
            item["latitude"] = coords["latitude"] if coords else None
            item["longitude"] = coords["longitude"] if coords else None
            item["listing_type"] = category

        return Response(results, status=status.HTTP_200_OK)
