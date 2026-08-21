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
from ..cache_management import (
    HOUSE_CACHE_PREFIX,
    get_cached_listing_page,
    set_cached_listing_page,
    flush_listing_cache,
)


class HousePagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    page_query_param = 'page'
    max_page_size = 50


class HouseListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        # 1. Cache Check: return early on cache hit
        cache_key, cached_data = get_cached_listing_page(
            HOUSE_CACHE_PREFIX, request)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        # 2. Database query and pagination
        house_queryset = filter_listings(
            HouseListing, HouseFilter, request.query_params)
        paginator = HousePagination()
        paginated_houses = paginator.paginate_queryset(
            queryset=house_queryset, request=request, view=self)

        # 3. Serialization and caching
        if paginated_houses is not None:
            serializer = HouseListingSerializer(paginated_houses, many=True)
            response = paginator.get_paginated_response(serializer.data)

            # Populate cache if request is cacheable
            set_cached_listing_page(cache_key, response.data)

            return response

        # Fallback if pagination is disabled or returns None
        serializer = HouseListingSerializer(house_queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = HouseListingSerializer(data=request.data)
        if serializer.is_valid():
            house = create_listing(
                HouseListing,
                user=request.user,
                data=serializer.validated_data)
            # Flush the listing cache on creation
            flush_listing_cache(HOUSE_CACHE_PREFIX)
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

    def put(self, request, pk):  # Full update
        self.check_object_permissions(request, self.house)
        updated_house, errors = update_listing(
            self.house, HouseListingSerializer, request.data, partial=False)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Flush the listing cache on update
        flush_listing_cache(HOUSE_CACHE_PREFIX)
        return Response(HouseListingSerializer(updated_house).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):  # Partial update
        self.check_object_permissions(request, self.house)
        updated_house, errors = update_listing(
            self.house, HouseListingSerializer, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Flush the listing cache on update
        flush_listing_cache(HOUSE_CACHE_PREFIX)
        return Response(HouseListingSerializer(updated_house).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):  # List deletion
        self.check_object_permissions(request, self.house)
        delete_listing(user=request.user, pk=pk)
        # Flush the listing cache on deletion
        flush_listing_cache(HOUSE_CACHE_PREFIX)
        return Response({"detail": "Ev ilanı başarıyla silindi."}, status=status.HTTP_200_OK)
