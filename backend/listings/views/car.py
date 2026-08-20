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


class CarPagination(PageNumberPagination):
    # overriding the default values
    page_size = 24
    page_size_query_param = "page_size"
    page_query_param = 'page'
    max_page_size = 50


class CarListingView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    # because get_permissions() in view return [permission() for permission in self.permission_classes]
    # for each item in permission_classes, get_permissions() creates an object instance of it.

    def get(self, request):
        cars = filter_listings(CarListing, CarFilter, request.query_params)

        # Paginator
        paginator = CarPagination()
        page = paginator.paginate_queryset(
            queryset=cars, request=request, view=self)

        if page is not None:
            serializer = CarListingSerializer(page, many=True)
            # returns a dict of count, next, previous, results(data)
            return paginator.get_paginated_response(serializer.data)

        # kind of a fallback this part almost should never work
        serializer = CarListingSerializer(cars, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):  # List adding
        serializer = CarListingSerializer(data=request.data)
        # for the body json data, we can use request.data
        if serializer.is_valid():
            car = create_listing(CarListing, user=request.user,
                                 data=serializer.validated_data)
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
            self.car, CarListingSerializer, request.data, partial=True)
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
