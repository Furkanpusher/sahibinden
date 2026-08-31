from listings.models import HouseListing
from listings.serializers import HouseListingSerializer
from ..cache_management import HOUSE_CACHE_PREFIX
from .base import BaseListingListView, BaseListingDetailView


class HouseListView(BaseListingListView):
    model_class = HouseListing
    serializer_class = HouseListingSerializer
    cache_prefix = HOUSE_CACHE_PREFIX


class HouseDetailView(BaseListingDetailView):
    model_class = HouseListing
    serializer_class = HouseListingSerializer
    cache_prefix = HOUSE_CACHE_PREFIX
