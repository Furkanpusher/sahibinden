# Listing serializers halleder
from .models import Listing, CarListing, HouseListing, Favorite, Report, ListingImage
from rest_framework import serializers


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'image', 'is_cover', 'created_at']


class ListingSerializer(serializers.ModelSerializer):

    listing_owner = serializers.PrimaryKeyRelatedField(read_only=True)
    # only shows the id rather than the whole object

    images = ListingImageSerializer(many=True, read_only=True)

    # important for frontend routing
    listing_type = serializers.SerializerMethodField()
    # this field is not in the database, get_listing_type() function calculates it and adds to JSON object

    class Meta:
        model = Listing
        fields = ['id', 'title', 'city', 'district', 'price', 'listing_owner',
                  'listing_date', 'listing_update', 'listing_type', 'images']

    def get_listing_type(self, obj):  # must be get_<field_name>
        if hasattr(obj, 'carlisting'):
            return 'car'
        elif hasattr(obj, 'houselisting'):
            return 'house'
        return 'unknown'


class CarListingSerializer(serializers.ModelSerializer):
    listing_owner = serializers.PrimaryKeyRelatedField(
        read_only=True)  # post ile gönderemezsin
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = CarListing
        fields = ['id', 'title', 'city', 'district', 'price', 'listing_owner', 'listing_date',
                  'brand', 'series', 'model', 'year', 'transmission_type', 'km', 'fuel_type', 'body_type',
                  'color', 'engine_size', 'engine_power', 'traction', 'status', 'avg_fuel_consumption',
                  'fuel_tank', 'changed_parts', 'for_trade', 'from_whom', 'tramer', 'images']


class HouseListingSerializer(serializers.ModelSerializer):
    listing_owner = serializers.PrimaryKeyRelatedField(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = HouseListing
        fields = ['id', 'title', 'city', 'district', 'price', 'listing_owner', 'listing_date',
                  'meter_squared', 'building_aged', 'number_of_floors', 'number_of_rooms',
                  'floor', 'credit_eligibility', 'images']


class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'listing', 'created_at', 'user']


class ReportSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'listing', 'description', 'report_date', 'user']
