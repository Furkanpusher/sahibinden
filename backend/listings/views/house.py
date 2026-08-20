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


class HousePagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    page_query_param = 'page'
    max_page_size = 50


class HouseListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        houses = filter_listings(
            HouseListing, HouseFilter, request.query_params)

        paginator = HousePagination()
        page = paginator.paginate_queryset(
            queryset=houses, request=request, view=self)

        if page is not None:
            serializer = HouseListingSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        # Fallback
        serializer = HouseListingSerializer(houses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # IsAuthenticated
        serializer = HouseListingSerializer(data=request.data)
        if serializer.is_valid():
            house = create_listing(
                HouseListing, user=request.user, data=serializer.validated_data)
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
