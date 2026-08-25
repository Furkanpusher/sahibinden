from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import status
from listings.models import CarListing
from listings.serializers import CarListingSerializer
from listings.permissions import IsOwnerOrReadOnly
from rest_framework.pagination import PageNumberPagination
from ..services import (filter_listings, get_listing_by_id,
                        create_listing, delete_listing, update_listing)
from ..filters import CarFilter
from django.core.cache import cache
from ..cache_management import (
    CAR_CACHE_PREFIX,
    get_cached_listing_page,
    set_cached_listing_page,
    flush_listing_cache,
)


class CarPagination(PageNumberPagination):
    # overriding the default values
    page_size = 24
    page_size_query_param = "page_size"
    page_query_param = 'page'
    max_page_size = 50



class CarListingView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        # 1. Cache Check: return early on cache hit
        cache_key, cached_data = get_cached_listing_page(
            CAR_CACHE_PREFIX, request)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        # 2. Database query and pagination
        car_queryset = filter_listings(
            CarListing, CarFilter, request.query_params)
        paginator = CarPagination()
        paginated_cars = paginator.paginate_queryset(
            car_queryset, request, view=self)

        # 3. Serialization and caching
        if paginated_cars is not None:
            serializer = CarListingSerializer(paginated_cars, many=True)
            response = paginator.get_paginated_response(serializer.data)

            # Populate cache if request is cacheable (handled inside helper)
            set_cached_listing_page(cache_key, response.data)

            return response

        # Fallback if pagination is disabled or returns None
        serializer = CarListingSerializer(car_queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CarListingSerializer(data=request.data)
        if serializer.is_valid():
            car = create_listing(
                CarListing,
                user=request.user,
                data=serializer.validated_data
            )
            # flush the cache
            flush_listing_cache(CAR_CACHE_PREFIX)
            return Response(CarListingSerializer(car).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CarDetailView(APIView):

    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    # permission_classes work as just an array. django does get_permissions to all this permission object
    # user is authenticated, or is a read-only request.

    def dispatch(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        self.car = get_listing_by_id(CarListing, pk=pk)
        return super().dispatch(request, *args, **kwargs)  # root dispatch continues

    def get(self, request, pk):
        serializer = CarListingSerializer(self.car)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):  # list updating
        self.check_object_permissions(request, self.car)  # is he the owner?
        updated_car, errors = update_listing(
            self.car, CarListingSerializer, request.data, partial=False)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # flush the listing cache on update
        flush_listing_cache(CAR_CACHE_PREFIX)
        return Response(CarListingSerializer(updated_car).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):  # partial list updating
        self.check_object_permissions(request, self.car)
        updated_car, errors = update_listing(
            self.car, CarListingSerializer, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # flush the listing cache on update
        flush_listing_cache(CAR_CACHE_PREFIX)
        return Response(CarListingSerializer(updated_car).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):  # list deletion
        self.check_object_permissions(request, self.car)
        delete_listing(user=request.user, pk=pk)
        # flush the listing cache on deletion
        flush_listing_cache(CAR_CACHE_PREFIX)
        return Response({"detail": "İlan başarıyla silindi."}, status=status.HTTP_200_OK)
