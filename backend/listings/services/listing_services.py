from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from listings.models import Listing, Favorite, Report, ListingImage
from accounts.models import CustomUser, Follow
from listings.tasks import (price_update_notification,
                            listing_updated_notification,
                            send_seller_followers_notification)


""" BASIC GET METHODS """


# Retrieves all listings of a specific model with their owners
def get_all_listings(model_class):
    return model_class.objects.select_related("listing_owner").all().order_by("-listing_date")


# Retrieves a listing by ID for a given model
def get_listing_by_id(model_class, pk):
    return get_object_or_404(model_class.objects.select_related("listing_owner"), pk=pk)


""" FILTERING FUNCTION """


def filter_listings(model_class, query_params):
    qs = model_class.objects.select_related(
        "listing_owner").all().order_by("-listing_date")
    ids = query_params.get("ids")
    if ids:
        id_list = [int(v.strip())
                   for v in str(ids).split(",") if v.strip().isdigit()]
        if id_list:
            qs = qs.filter(id__in=id_list)
    return qs


""" LISTING CRUD OPERATIONS """


def create_listing(model_class, user, data):
    # Create a new listing
    listing = model_class.objects.create(listing_owner=user, **data)
    # send notification to this sellers followers about this new listing
    send_seller_followers_notification.delay(listing.pk)
    return listing


def delete_listing(user, pk):
    # Delete a listing (only owner is authorized)
    listing = get_object_or_404(Listing, pk=pk)
    if listing.listing_owner != user:
        raise PermissionDenied("You can only delete your own listing.")
    listing.delete()


def update_listing(instance, serializer_class, data, partial=True):
    # Update a listing with partial update support
    serializer = serializer_class(instance, data=data, partial=partial)
    if serializer.is_valid():  # first it has to be valid
        old_price = instance.price
        updated_instance = serializer.save()  # update the listing
        if old_price != updated_instance.price:
            price_update_notification.delay(  # just price change
                old_price, updated_instance.price, instance.pk)
        else:
            listing_updated_notification.delay(
                instance.pk)  # other any update except price
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


""" FOLLOWER """


def toggle_follow(follower, seller_id):
    seller = get_object_or_404(CustomUser, pk=seller_id)
    if follower == seller:
        raise PermissionDenied("You cannot follow yourself.")
    follower_obj, created = Follow.objects.get_or_create(
        follower=follower, seller=seller)
    if not created:
        follower_obj.delete()
        return False, seller.followers.count()
    return True, seller.followers.count()
    # return the count of followers, we can do this because of "related_name" field in Follow model


def get_seller_by_id(seller_id):
    return get_object_or_404(CustomUser, pk=seller_id)


def get_seller_listings(seller):
    return seller.ilanlar.all().prefetch_related("images").order_by("-listing_date")
