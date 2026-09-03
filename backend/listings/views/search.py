from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from ..services.search_services import (
    search_car_listings,
    search_house_listings,
)


class CarSearchAPIView(APIView):
    # Elasticsearch search and filter view for cars
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            results = search_car_listings(**request.query_params.dict())
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Elasticsearch arama hatası: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HouseSearchAPIView(APIView):
    # Elasticsearch search and filter view for houses
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            results = search_house_listings(**request.query_params.dict())
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Elasticsearch arama hatası: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
