from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter

from ..services.search_services import (
    search_car_listings,
    search_house_listings,
)


class CarSearchAPIView(APIView):
    """
    Elasticsearch full-text search & filtering endpoint for Car Listings.
    """
    permission_classes = [AllowAny]  # anyone can search

    @extend_schema(
        summary="Elasticsearch Araç Arama & Filtreleme",
        description="Başlık, marka, modelde full-text ve fuzzy arama ile çoklu parametre filtrelemesi yapar.",
        parameters=[
            OpenApiParameter(
                name="q", description="Arama metni (Başlık, Marka, Model)", required=False, type=str),
            OpenApiParameter(name="brand", description="Marka",
                             required=False, type=str),
            OpenApiParameter(name="model", description="Model",
                             required=False, type=str),
            OpenApiParameter(name="city", description="Şehir",
                             required=False, type=str),
            OpenApiParameter(name="district", description="İlçe",
                             required=False, type=str),
            OpenApiParameter(name="transmission_type",
                             description="Vites Türü", required=False, type=str),
            OpenApiParameter(
                name="fuel_type", description="Yakıt Türü", required=False, type=str),
            OpenApiParameter(
                name="body_type", description="Kasa Tipi", required=False, type=str),
            OpenApiParameter(name="color", description="Renk",
                             required=False, type=str),
            OpenApiParameter(name="from_whom",
                             description="Kimden", required=False, type=str),
            OpenApiParameter(
                name="for_trade", description="Takaslı mı (true/false)", required=False, type=bool),
            OpenApiParameter(
                name="min_price", description="Minimum Fiyat", required=False, type=float),
            OpenApiParameter(
                name="max_price", description="Maksimum Fiyat", required=False, type=float),
            OpenApiParameter(
                name="min_year", description="Minimum Yıl", required=False, type=int),
            OpenApiParameter(
                name="max_year", description="Maksimum Yıl", required=False, type=int),
            OpenApiParameter(
                name="min_km", description="Minimum KM", required=False, type=int),
            OpenApiParameter(
                name="max_km", description="Maksimum KM", required=False, type=int),
            OpenApiParameter(
                name="sort", description="Sıralama (price_asc, price_desc, year_desc, km_asc, date_desc)", required=False, type=str),
            OpenApiParameter(
                name="page", description="Sayfa Numarası", required=False, type=int),
            OpenApiParameter(
                name="page_size", description="Sayfa Başına İlan", required=False, type=int),
        ],
    )
    def get(self, request):
        params = {
            'q': request.query_params.get('q'),
            'brand': request.query_params.get('brand'),
            'model': request.query_params.get('model'),
            'city': request.query_params.get('city'),
            'district': request.query_params.get('district'),
            'transmission_type': request.query_params.get('transmission_type'),
            'fuel_type': request.query_params.get('fuel_type'),
            'body_type': request.query_params.get('body_type'),
            'color': request.query_params.get('color'),
            'from_whom': request.query_params.get('from_whom'),
            'for_trade': request.query_params.get('for_trade'),
            'min_price': request.query_params.get('min_price') or request.query_params.get('price_min'),
            'max_price': request.query_params.get('max_price') or request.query_params.get('price_max'),
            'min_year': request.query_params.get('min_year') or request.query_params.get('year_min'),
            'max_year': request.query_params.get('max_year') or request.query_params.get('year_max'),
            'min_km': request.query_params.get('min_km') or request.query_params.get('km_min'),
            'max_km': request.query_params.get('max_km') or request.query_params.get('km_max'),
            'sort': request.query_params.get('sort', '-listing_date'),
            'page': request.query_params.get('page', 1),
            'page_size': request.query_params.get('page_size', 20),
        }

        # Parse boolean
        if params['for_trade'] is not None:
            params['for_trade'] = str(params['for_trade']).lower() in [
                'true', '1', 'yes']

        try:
            results = search_car_listings(**params)
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Elasticsearch arama hatası: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HouseSearchAPIView(APIView):
    """
    Elasticsearch full-text search & filtering endpoint for House Listings.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Elasticsearch Konut Arama & Filtreleme",
        description="Başlık, şehir, ilçede full-text ve fuzzy arama ile ev özellikleri filtrelemesi yapar.",
        parameters=[
            OpenApiParameter(
                name="q", description="Arama metni (Başlık, Şehir, İlçe)", required=False, type=str),
            OpenApiParameter(name="city", description="Şehir",
                             required=False, type=str),
            OpenApiParameter(name="district", description="İlçe",
                             required=False, type=str),
            OpenApiParameter(
                name="number_of_rooms", description="Oda Sayısı (örn: 3+1)", required=False, type=str),
            OpenApiParameter(name="building_aged",
                             description="Bina Yaşı", required=False, type=str),
            OpenApiParameter(
                name="floor", description="Bulunduğu Kat", required=False, type=str),
            OpenApiParameter(name="credit_eligibility",
                             description="Krediye Uygun mu (true/false)", required=False, type=bool),
            OpenApiParameter(
                name="min_price", description="Minimum Fiyat", required=False, type=float),
            OpenApiParameter(
                name="max_price", description="Maksimum Fiyat", required=False, type=float),
            OpenApiParameter(name="min_meter_squared",
                             description="Minimum m²", required=False, type=int),
            OpenApiParameter(name="max_meter_squared",
                             description="Maksimum m²", required=False, type=int),
            OpenApiParameter(
                name="min_floors", description="Minimum Kat Sayısı", required=False, type=int),
            OpenApiParameter(
                name="max_floors", description="Maksimum Kat Sayısı", required=False, type=int),
            OpenApiParameter(
                name="sort", description="Sıralama (price_asc, price_desc, meter_desc, date_desc)", required=False, type=str),
            OpenApiParameter(
                name="page", description="Sayfa Numarası", required=False, type=int),
            OpenApiParameter(
                name="page_size", description="Sayfa Başına İlan", required=False, type=int),
        ],
    )
    def get(self, request):
        params = {
            'q': request.query_params.get('q'),
            'city': request.query_params.get('city'),
            'district': request.query_params.get('district'),
            'number_of_rooms': request.query_params.get('number_of_rooms'),
            'building_aged': request.query_params.get('building_aged'),
            'floor': request.query_params.get('floor'),
            'credit_eligibility': request.query_params.get('credit_eligibility'),
            'min_price': request.query_params.get('min_price') or request.query_params.get('price_min'),
            'max_price': request.query_params.get('max_price') or request.query_params.get('price_max'),
            'min_meter_squared': request.query_params.get('min_meter_squared') or request.query_params.get('meter_squared_min'),
            'max_meter_squared': request.query_params.get('max_meter_squared') or request.query_params.get('meter_squared_max'),
            'min_floors': request.query_params.get('min_floors'),
            'max_floors': request.query_params.get('max_floors'),
            'sort': request.query_params.get('sort', '-listing_date'),
            'page': request.query_params.get('page', 1),
            'page_size': request.query_params.get('page_size', 20),
        }

        if params['credit_eligibility'] is not None:
            params['credit_eligibility'] = str(params['credit_eligibility']).lower() in [
                'true', '1', 'yes']

        try:
            results = search_house_listings(**params)
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Elasticsearch arama hatası: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
