from django_filters import rest_framework as filters
from .models import CarListing, HouseListing


class CarFilter(filters.FilterSet):
    brand = filters.CharFilter(field_name="brand", lookup_expr="iexact")
    model = filters.CharFilter(field_name="model", lookup_expr="iexact")
    city = filters.CharFilter(field_name="city", lookup_expr="iexact")
    district = filters.CharFilter(field_name="district", lookup_expr="iexact")
    transmission_type = filters.CharFilter(method="filter_transmission")
    # Support both price_min / price_max and min_price / max_price
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")

    def filter_transmission(self, queryset, name, value):
        if not value:
            return queryset
        val_norm = value.strip().lower()
        mapping = {
            "düz": "manuel",
            "duz": "manuel",
            "manuel": "manuel",
            "manual": "manuel",
            "otomatik": "otomatik",
            "automatic": "otomatik",
            "yarı otomatik": "yarı otomatik",
            "yari otomatik": "yarı otomatik",
        }
        target_val = mapping.get(val_norm, val_norm)
        return queryset.filter(transmission_type__iexact=target_val)

    class Meta:
        model = CarListing
        fields = [
            "brand", "model", "city", "district",
            "transmission_type", "price_min", "price_max"
        ]


class HouseFilter(filters.FilterSet):
    number_of_rooms = filters.CharFilter(
        field_name="number_of_rooms", lookup_expr="exact"
    )
    building_aged = filters.CharFilter(
        field_name="building_aged", lookup_expr="exact"
    )
    floor = filters.CharFilter(field_name="floor", lookup_expr="exact")
    meter_squared = filters.NumberFilter(
        field_name="meter_squared", lookup_expr="gte"
    )
    city = filters.CharFilter(field_name="city", lookup_expr="iexact")
    district = filters.CharFilter(field_name="district", lookup_expr="iexact")

    # Support both price_min / price_max and min_price / max_price
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = HouseListing
        fields = [
            "number_of_rooms", "building_aged", "floor",
            "meter_squared", "city", "district",
            "price_min", "price_max", "min_price", "max_price"
        ]
