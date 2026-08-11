# Listing serializers halleder
from .models import Listing, CarListing, HouseListing
from rest_framework import serializers

class ListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = ['id', 'title', 'location', 'price', 'listing_owner', 'listing_date', 'listing_update']

class CarListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarListing
        fields = ['id', 'title', 'location', 'price', 'listing_owner', 'listing_date',
                'brand', 'model', 'year', 'transmission_type', 'km', 'fuel_type', 'body_type',
                  'color', 'engine_size', 'engine_power', 'traction', 'status', 'avg_fuel_consumption',
                'fuel_tank', 'changed_parts', 'for_trade', 'from_whom', 'tramer']


class HouseListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseListing
        fields = ['id', 'title', 'location', 'price', 'listing_owner', 'listing_date',
                  'meter_squared', 'building_aged', 'number_of_floors', 'number_of_rooms',
                  'floor', 'credit_eligibility']