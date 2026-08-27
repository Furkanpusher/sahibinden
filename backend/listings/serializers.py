# Listing serializers halleder
from listings.models import Listing, CarListing, HouseListing, Favorite, Report, ListingImage, Notification, Alarm
from accounts.models import CustomUser
from rest_framework import serializers
from accounts.serializers import UserPublicSerializer


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'image', 'is_cover', 'created_at']


class ListingSerializer(serializers.ModelSerializer):

    listing_owner = UserPublicSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)

    # important for frontend routing
    listing_type = serializers.SerializerMethodField()

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
    listing_owner = UserPublicSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)

    TRANSMISSION_MAP = {
        "düz": "manuel",
        "duz": "manuel",
        "manuel": "manuel",
        "manual": "manuel",
        "otomatik": "otomatik",
        "automatic": "otomatik",
        "yarı otomatik": "yarı otomatik",
        "yari otomatik": "yarı otomatik",
    }

    def to_internal_value(self, data):
        if hasattr(data, "copy"):
            data = data.copy()
        else:
            data = dict(data)

        vites = data.get("transmission_type")
        if isinstance(vites, str) and vites.strip():
            vites_norm = vites.strip().lower()
            data["transmission_type"] = self.TRANSMISSION_MAP.get(
                vites_norm, vites)

        return super().to_internal_value(data)

    class Meta:
        model = CarListing
        fields = ['id', 'title', 'city', 'district', 'price', 'listing_owner', 'listing_date',
                  'brand', 'series', 'model', 'year', 'transmission_type', 'km', 'fuel_type', 'body_type',
                  'color', 'engine_size', 'engine_power', 'traction', 'status', 'avg_fuel_consumption',
                  'fuel_tank', 'changed_parts', 'for_trade', 'from_whom', 'tramer', 'images']


class HouseListingSerializer(serializers.ModelSerializer):
    listing_owner = UserPublicSerializer(read_only=True)
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


class NotificationSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'listing', 'user', 'message', 'is_read', 'created_at']


class AlarmSerializer(serializers.ModelSerializer):

    # if it's GET we'll use this and return the whole list object
    listing = ListingSerializer(read_only=True)

    # if it's POST/PUT we'll use this and accept listing_id in POST/PUT
    listing_id = serializers.PrimaryKeyRelatedField(
        queryset=Listing.objects.all(),
        source='listing',
        write_only=True,
        allow_null=True,  # (null allowed for not existing listings yet)
        required=False    # not require for non existed listing alarms
    )
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Alarm
        fields = ['id', 'listing', 'listing_id', 'user',
                  'alarm_type', 'params', 'is_active', 'last_checked', 'created_at']


# FOLLOW SERIALIZERS


class FollowedSellerWithListingsSerializer(serializers.ModelSerializer):
    # because related_name is "ilanlar" in listings model, we use source="ilanlar"
    listings = ListingSerializer(source="ilanlar", many=True, read_only=True)
    total_listings_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "profile_picture",
            "total_listings_count",
            "listings",  # Satıcının tüm ilanları burada dizi olarak döner
        ]

    def get_total_listings_count(self, obj):
        return obj.ilanlar.count()


class SellerPublicProfileSerializer(serializers.ModelSerializer):
    total_listings_count = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    # is the current user following this seller?

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "profile_picture",
            "date_joined",
            "total_listings_count",
            "follower_count",
            "is_following",
        ]

    def get_total_listings_count(self, obj):
        return obj.ilanlar.count()

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        # if logged in, check if the user follows this seller, else return False
        if request and request.user.is_authenticated:
            return obj.followers.filter(follower=request.user).exists()
        return False
