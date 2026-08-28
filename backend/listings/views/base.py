from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from listings.permissions import IsOwnerOrReadOnly
from ..services import (
    filter_listings,
    get_listing_by_id,
    create_listing,
    delete_listing,
    update_listing,
)
from ..cache_management import (
    get_cached_listing_page,
    set_cached_listing_page,
    flush_listing_cache,
)


class StandardListingPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    page_query_param = "page"
    max_page_size = 50


class BaseListingListView(APIView):
    """
    Base generic list view supporting caching, filtering, and pagination.
    Subclasses should define:
      - model_class
      - serializer_class
      - filter_class
      - cache_prefix

      this way it's a lot easier to add more categories in the future
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardListingPagination
    model_class = None
    serializer_class = None
    filter_class = None
    cache_prefix = None

    def get(self, request):  # get request while an item is deleted!
        # 1. Cache check
        cache_key, cached_data = get_cached_listing_page(
            self.cache_prefix, request)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        # 2. Database query and pagination
        queryset = filter_listings(
            self.model_class, self.filter_class, request.query_params)
        paginator = self.pagination_class()
        paginated_items = paginator.paginate_queryset(
            queryset, request, view=self)

        # 3. Serialization and caching
        if paginated_items is not None:
            serializer = self.serializer_class(paginated_items, many=True)
            response = paginator.get_paginated_response(serializer.data)
            set_cached_listing_page(cache_key, response.data)
            return response

        # Fallback if pagination is not active
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            instance = create_listing(
                self.model_class,
                user=request.user,
                data=serializer.validated_data,
            )
            flush_listing_cache(self.cache_prefix)
            return Response(self.serializer_class(instance).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BaseListingDetailView(APIView):
    """
    Base generic detail view supporting retrieval, updates (full/partial),
    and deletion with permission checks and cache invalidation.
    Subclasses should define:
      - model_class
      - serializer_class
      - cache_prefix
    """
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    model_class = None
    serializer_class = None
    cache_prefix = None

    def dispatch(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        self.instance = get_listing_by_id(self.model_class, pk=pk)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request, pk):
        serializer = self.serializer_class(self.instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        self.check_object_permissions(request, self.instance)
        updated_instance, errors = update_listing(
            self.instance, self.serializer_class, request.data, partial=False
        )
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        flush_listing_cache(self.cache_prefix)
        return Response(self.serializer_class(updated_instance).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        self.check_object_permissions(request, self.instance)
        updated_instance, errors = update_listing(
            self.instance, self.serializer_class, request.data, partial=True
        )
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        flush_listing_cache(self.cache_prefix)
        return Response(self.serializer_class(updated_instance).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        self.check_object_permissions(request, self.instance)
        delete_listing(user=request.user, pk=pk)
        flush_listing_cache(self.cache_prefix)
        return Response({"detail": "İlan başarıyla silindi."}, status=status.HTTP_200_OK)
