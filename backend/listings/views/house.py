from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from listings.models import HouseListing
from listings.serializers import HouseListingSerializer
from listings.permissions import IsOwnerOrReadOnly
from ..services import (filter_listings, get_listing_by_id,
                        create_listing, delete_listing, update_listing)
from ..filters import HouseFilter
from django.core.cache import cache


class HousePagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    page_query_param = 'page'
    max_page_size = 50


CACHE_TIMEOUT = 60 * 60  # 1 hour
CACHEABLE_PAGES = {"1", "2"}
CACHE_KEY_PREFIX = "house_listings_page"


class HouseListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):

        page_number = request.query_params.get("page", "1")
        has_custom_fiters = any(key != "page" for key in request.query_params)
        is_cacheable = (not has_custom_fiters) and (
            page_number in CACHEABLE_PAGES)
        cache_key = f"{CACHE_KEY_PREFIX}_{page_number}"

        # 2. Cache check
        if is_cacheable:
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response(cached_data, status=status.HTTP_200_OK)
        # get pagination
        house_queryset = filter_listings(
            HouseListing, HouseFilter, request.query_params
        )
        paginator = HousePagination()
        paginated_houses = paginator.paginate_queryset(
            queryset=house_queryset, request=request, view=self
        )

        if paginated_houses is not None:
            serializer = HouseListingSerializer(paginated_houses, many=True)
            response = paginator.get_paginated_response(serializer.data)
            if is_cacheable:
                cache.set(cache_key, response.data, timeout=CACHE_TIMEOUT)
            return response

        # Fallback
        serializer = HouseListingSerializer(house_queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):

        serializer = HouseListingSerializer(data=request.data)
        if serializer.is_valid():
            house = create_listing(
                HouseListing,
                user=request.user,
                data=serializer.validated_data)
            # if creation is successfull flush the cache
            cache.delete_many(keys=[
                f"{CACHE_KEY_PREFIX}_{page}" for page in CACHEABLE_PAGES
            ])
            return Response(HouseListingSerializer(house).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HouseDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def dispatch(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        self.house = get_listing_by_id(HouseListing, pk=pk)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request, pk):
        serializer = HouseListingSerializer(self.house)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        self.check_object_permissions(request, self.house)
        updated_house, errors = update_listing(
            self.house, HouseListingSerializer, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(HouseListingSerializer(updated_house).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        self.check_object_permissions(request, self.house)
        updated_house, errors = update_listing(
            self.house, HouseListingSerializer, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(HouseListingSerializer(updated_house).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        self.check_object_permissions(request, self.house)
        delete_listing(user=request.user, pk=pk)
        return Response({"detail": "Ev ilanı başarıyla silindi."}, status=status.HTTP_200_OK)
