# Listing serializers halleder
from .models import Listing, CarListing, HouseListing, Favorite
from rest_framework import serializers

class ListingSerializer(serializers.ModelSerializer):
    listing_owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Listing
        fields = ['id', 'title', 'city', 'district', 'price', 'listing_owner', 'listing_date', 'listing_update']

class CarListingSerializer(serializers.ModelSerializer):
    listing_owner = serializers.PrimaryKeyRelatedField(read_only=True) # post ile gönderemezsin

    class Meta: 
        model = CarListing
        fields = ['id', 'title', 'city', 'district', 'price', 'listing_owner', 'listing_date',
                'brand', 'series', 'model', 'year', 'transmission_type', 'km', 'fuel_type', 'body_type',
                'color', 'engine_size', 'engine_power', 'traction', 'status', 'avg_fuel_consumption',
                'fuel_tank', 'changed_parts', 'for_trade', 'from_whom', 'tramer']


class HouseListingSerializer(serializers.ModelSerializer):
    listing_owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = HouseListing
        fields = ['id', 'title', 'city', 'district', 'price', 'listing_owner', 'listing_date',
                  'meter_squared', 'building_aged', 'number_of_floors', 'number_of_rooms',
                  'floor', 'credit_eligibility']


class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only = True)

    class Meta:
        model = Favorite
        fields = ['id', 'listing', 'created_at']

