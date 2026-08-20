from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Listing, CarListing, HouseListing, Favorite, Report, ListingImage
from .filters import CarFilter, HouseFilter


""" BASIC GET METHODS """

# Retrieves all car listings with their owners


def get_all_cars():
    return CarListing.objects.select_related("listing_owner").all().order_by("-id")


# Retrieves all house listings with their owners
def get_all_houses():
    return HouseListing.objects.select_related("listing_owner").all().order_by("-id")


def get_car_by_id(pk):
    return get_object_or_404(CarListing, pk=pk)


def get_house_by_id(pk):
    return get_object_or_404(HouseListing, pk=pk)


""" FILTERING FUNCTIONS """

# Car listing search & filter


def filter_cars(query_params=None, **kwargs):
    params = query_params if query_params is not None else kwargs
    qs = CarListing.objects.select_related("listing_owner").all().order_by("-id")
    return CarFilter(params, queryset=qs).qs


# House listing search & filter
def filter_houses(query_params=None, **kwargs):
    params = query_params if query_params is not None else kwargs
    qs = HouseListing.objects.select_related("listing_owner").all().order_by("-id")
    return HouseFilter(params, queryset=qs).qs


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
    if serializer.is_valid():
        updated_instance = serializer.save()
        return updated_instance, None
    return None, serializer.errors


""" FAVORITES """

# Toggle favorite status for a listing


def toggle_favorite(user, pk):
    listing = get_object_or_404(Listing, pk=pk)

    # get_or_create prevents duplicate objects in the database
    favorite, created = Favorite.objects.get_or_create(
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

# Report a listing


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

# Upload and attach images to a listing


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
