from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from ..services.search_services import (
    search_car_listings,
    search_house_listings,
)


SEARCH_HANDLERS = {
    "car": search_car_listings,
    "cars": search_car_listings,
    "house": search_house_listings,
    "houses": search_house_listings,
}


class SearchAPIView(APIView):
    """
    Unified Elasticsearch search and filter view for cars and houses.
    Supports category both as path param (/search/cars/) and query param (/search/?category=car).
    """
    permission_classes = [AllowAny]

    def get(self, request, category=None):
        chosen_category = (category or request.query_params.get(
            "category", "")).lower().strip()
        search_func = SEARCH_HANDLERS.get(chosen_category)

        if not search_func:
            return Response(
                {"error": "Invalid category. Try 'cars' or 'houses'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            params = request.query_params.dict()
            params.pop("category", None)
            results = search_func(**params)
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Elasticsearch search error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
