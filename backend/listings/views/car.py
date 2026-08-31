from listings.models import CarListing
from listings.serializers import CarListingSerializer
from ..cache_management import CAR_CACHE_PREFIX
from .base import BaseListingListView, BaseListingDetailView


class CarListingView(BaseListingListView):
    model_class = CarListing
    serializer_class = CarListingSerializer
    cache_prefix = CAR_CACHE_PREFIX


class CarDetailView(BaseListingDetailView):
    model_class = CarListing
    serializer_class = CarListingSerializer
    cache_prefix = CAR_CACHE_PREFIX
