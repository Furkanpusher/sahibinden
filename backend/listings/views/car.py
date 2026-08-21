from listings import serializers
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


class CarPagination(PageNumberPagination):
    # overriding the default values
    page_size = 24
    page_size_query_param = "page_size"
    page_query_param = 'page'
    max_page_size = 50


CACHE_TIMEOUT = 60 * 60  # 1 hour
CACHEABLE_PAGES = {"1", "2"}
CACHE_KEY_PREFIX = "car_listings_page"


class CarListingView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):

        page_number = request.query_params.get("page", "1")  # default page 1
        has_custom_filters = any(key != "page" for key in request.query_params)
        is_cacheable = (not has_custom_filters) and (
            page_number in CACHEABLE_PAGES)
        cache_key = f"{CACHE_KEY_PREFIX}_{page_number}"

        # 2. Cache check - if hit return
        if is_cacheable:
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response(cached_data, status=status.HTTP_200_OK)

        # get pagination object
        car_queryset = filter_listings(
            CarListing, CarFilter, request.query_params)
        paginator = CarPagination()
        paginated_cars = paginator.paginate_queryset(
            car_queryset, request, view=self)

        if paginated_cars is not None:
            serializer = CarListingSerializer(paginated_cars, many=True)
            response = paginator.get_paginated_response(serializer.data)

            if is_cacheable:  # if it's cachable and not in the cache before -> cache it
                cache.set(cache_key, response.data, timeout=CACHE_TIMEOUT)

            return response

        # Fallback if the pagination returns None(won't need it tho)
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
            # if creation is successful flush the first 2 pages from cache
            cache.delete_many(keys=[
                f"{CACHE_KEY_PREFIX}_{page}" for page in CACHEABLE_PAGES
            ])
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
        return Response(CarListingSerializer(updated_car).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):  # partial list updating
        self.check_object_permissions(request, self.car)
        updated_car, errors = update_listing(
            self.car, CarListingSerializer, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(CarListingSerializer(updated_car).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):  # list deletion
        self.check_object_permissions(request, self.car)

        delete_listing(user=request.user, pk=pk)
        return Response({"detail": "İlan başarıyla silindi."}, status=status.HTTP_200_OK)
