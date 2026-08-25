from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Listing, Favorite, Report, ListingImage, Alarm
from django.core.cache import cache
from listings.tasks import price_update_notification, listing_updated_notification


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
        if old_price != updated_instance.price:
            price_update_notification.delay(
                old_price, updated_instance.price, instance.pk)
        else:
            listing_updated_notification.delay(instance.pk)
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

MAX_ALARMS_PER_USER = 5


def create_alarm(alarm_type, params, listing_id, user):

    # maximum 5 active alarms allowed for each user
    if not can_user_create_new_alarm(user):
        raise ValidationError(
            "You can have maximum 5 active alarms. Please delete or deactivate an existing alarm before creating a new one.")

    # LISTING_REQUIRED
    if alarm_type in Alarm.LISTING_REQUIRED:
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

    # NON_LISTING_REQUIRED
    if alarm_type in Alarm.NON_LISTING_REQUIRED:
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


def delete_alarm(user, pk):
    alarm = get_object_or_404(Alarm, pk=pk)
    if alarm.user != user:
        raise PermissionDenied("You can only delete your own alarm.")
    alarm.delete()
    return True


def toggle_alarm(user, pk):
    # user can have maximum 5 active alarms
    # if wants to create more alarms, he has to deactivate previous alarms
    alarm = get_object_or_404(Alarm, pk=pk)
    if alarm.user != user:
        raise PermissionDenied("You can only deactivate your own alarm.")

    # if alarm is inactive and user CANNOT add more alarms (already has 5 active alarms)
    if not alarm.is_active and not can_user_create_new_alarm(user):
        raise ValidationError(
            "You can have maximum 5 active alarms. Please delete or deactivate an existing alarm before creating a new one.")

    alarm.is_active = not alarm.is_active  # toggle
    alarm.save()
    return alarm.is_active  # return new state so view can respond accordingly


def can_user_create_new_alarm(user):
    # returns True if user can create more alarms, False otherwise
    active_alarms_count = Alarm.objects.filter(
        user=user, is_active=True).count()
    if active_alarms_count >= MAX_ALARMS_PER_USER:
        return False
    return True
