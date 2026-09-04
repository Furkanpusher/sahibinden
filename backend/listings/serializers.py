# Listing serializers halleder
from listings.models import Listing, CarListing, HouseListing, Favorite, Report, ListingImage, Notification, Alarm
from accounts.models import CustomUser
from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .services.map_services import get_district_coordinates


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


class ListingMinimalSerializer(serializers.ModelSerializer):
    # lightweight version for alarms and notifications
    listing_type = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = ['id', 'title', 'price', 'listing_type']

    def get_listing_type(self, obj):
        if hasattr(obj, 'carlisting'):
            return 'car'
        elif hasattr(obj, 'houselisting'):
            return 'house'
        return 'unknown'


class ReportSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'listing', 'description', 'report_date', 'user']


class NotificationSerializer(serializers.ModelSerializer):
    listing = ListingMinimalSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'listing', 'user', 'message', 'is_read', 'created_at']


class AlarmSerializer(serializers.ModelSerializer):

    # lightweight listing representation
    listing = ListingMinimalSerializer(read_only=True)

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


class FollowedSellerListingPreviewSerializer(serializers.ModelSerializer):
    listing_type = serializers.SerializerMethodField()
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = ['id', 'title', 'price', 'listing_type', 'images']

    def get_listing_type(self, obj):
        if hasattr(obj, 'carlisting'):
            return 'car'
        elif hasattr(obj, 'houselisting'):
            return 'house'
        return 'unknown'


# The sellers I followed
class FollowedSellerWithListingsSerializer(serializers.ModelSerializer):
    listings = serializers.SerializerMethodField()
    total_listings_count = serializers.IntegerField(read_only=True)

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
            "listings",
        ]

    def get_listings(self, obj):
        # only fetch latest 2 listings for card preview
        recent = obj.ilanlar.select_related(
            'carlisting', 'houselisting'
        ).prefetch_related('images').order_by('-listing_date')[:2]
        return FollowedSellerListingPreviewSerializer(recent, many=True).data


# Seller public profile
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


class MapSerializer(serializers.ModelSerializer):
    listing_type = serializers.SerializerMethodField()
    coordinates = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id",
            "title",
            "price",
            "city",
            "district",
            "coordinates",
            "listing_type",
            "image",
        ]

    def get_listing_type(self, obj):
        if hasattr(obj, "carlisting"):
            return "car"
        elif hasattr(obj, "houselisting"):
            return "house"
        return "unknown"

    def get_coordinates(self, obj):
        coords = get_district_coordinates(obj.city, obj.district)
        return coords  # latitude and longitude

    def get_image(self, obj):  # get the cover image, if not get the first one
        images = list(obj.images.all())
        if not images:
            return None
        cover = next((img for img in images if img.is_cover), images[0])
        if cover and cover.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(cover.image.url)
            return cover.image.url
        return None
