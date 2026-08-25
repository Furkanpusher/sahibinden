from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Listing, Favorite, Report, ListingImage, Notification, Alarm
from django.core.cache import cache
from listings.tasks import price_update_notification


""" BASIC GET METHODS """

# Retrieves all listings of a specific model with their owners


def get_all_listings(model_class):

    return model_class.objects.select_related("listing_owner").all().order_by("-listing_date")


# Retrieves a listing by ID for a given model
def get_listing_by_id(model_class, pk):
    return get_object_or_404(model_class, pk=pk)


""" FILTERING FUNCTION """


def filter_listings(model_class, filter_class, query_params):
    # you must specify which model and filter class you will use

    qs = model_class.objects.select_related(
        "listing_owner").all().order_by("-listing_date")
    return filter_class(query_params, queryset=qs).qs


""" LISTING CRUD OPERATIONS """


def create_listing(model_class, user, data):
    # Create a new listing
    return model_class.objects.create(listing_owner=user, **data)


def delete_listing(user, pk):
    # Delete a listing (only owner is authorized)
    listing = get_object_or_404(Listing, pk=pk)
    if listing.listing_owner != user:
        raise PermissionDenied("You can only delete your own listing.")
    listing.delete()


def update_listing(instance, serializer_class, data, partial=True):
    # Update a listing with partial update support
    serializer = serializer_class(instance, data=data, partial=partial)
    if serializer.is_valid():  # first it has to be vaild
        old_price = instance.price
        updated_instance = serializer.save()  # update the listing
        price_update_notification.delay(
            old_price, updated_instance.price, instance.pk)
        return updated_instance, None
    return None, serializer.errors


""" FAVORITES """


def toggle_favorite(user, pk):
    # Toggle favorite status for a listing
    listing = get_object_or_404(Listing, pk=pk)
    favorite, created = Favorite.objects.get_or_create(  # get_or_create prevents duplicate objects in the database
        user=user, listing=listing)

    # If already favorited, delete it on click (toggle behavior)
    if not created:
        favorite.delete()
        return False
    return True


# Get all favorites for a user
def get_user_favorites(user):
    return Favorite.objects.filter(user=user).select_related("listing")


""" REPORTS """


def report_listing(user, pk, description=""):
    listing = get_object_or_404(Listing, pk=pk)

    # Users cannot report their own listing
    if listing.listing_owner == user:
        raise PermissionDenied("You cannot report your own listing.")

    # Prevent duplicate reports from the same user for the same listing
    if Report.objects.filter(user=user, listing=listing).exists():
        raise ValidationError("You have already reported this listing.")

    report = Report.objects.create(
        user=user,
        listing=listing,
        description=description
    )
    return report


# Get reports created by a user
def get_user_reports(user):
    return Report.objects.filter(user=user).select_related("listing")


# Get all reports (for staff/admins)
def get_all_reports():
    return Report.objects.all().order_by("-report_date").select_related("listing")


""" LISTING IMAGES """


def add_images_to_listing(listing, image_files, is_cover=False):
    created_images = []
    for image_file in image_files:
        img_obj = ListingImage.objects.create(
            listing=listing,
            image=image_file,
            is_cover=is_cover
        )
        created_images.append(img_obj)
    return created_images


""" ALARM OPERATIONS """

# need this to distinguish between listing required
# and non listing required alarms
ALARM_TYPES = Alarm.ALARM_TYPES
LISTING_REQUIRED_ALARM_TYPES = {"price_drop",
                                "favorite_updated", "favorite_removed"}
NON_LISTING_REQUIRED_ALARM_TYPES = {"new_listing_check"}


def create_alarm(alarm_type, params, listing_id, user):

    # LISTING_REQUIRED_ALARM_TYPES
    if alarm_type in LISTING_REQUIRED_ALARM_TYPES:
        if not listing_id:
            raise ValidationError(
                "For this alarm type, the listing must be specified.")
        listing = get_object_or_404(Listing, pk=listing_id)
        if listing.listing_owner == user:
            raise ValidationError(
                "You cannot create an alarm for your own listing.")
        # can pass params it doesn't matter, won't use it anyway

        created_alarm = Alarm.objects.create(
            alarm_type=alarm_type,
            listing=listing,
            user=user,
            params={},
            is_active=True,
        )
        return created_alarm

    # NON_LISTING_REQUIRED_ALARM_TYPES
    if alarm_type in NON_LISTING_REQUIRED_ALARM_TYPES:
        # will use params in non_listing_types for now
        # don't care about listing_id
        if not params:
            raise ValidationError("Params are required for this alarm type.")

        created_alarm = Alarm.objects.create(
            alarm_type=alarm_type,
            user=user,
            params=params,
            is_active=True,
        )
        return created_alarm

    raise ValidationError("Invalid alarm type")
