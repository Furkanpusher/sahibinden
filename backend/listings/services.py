from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.db import models
from listings.models import Listing, CarListing, HouseListing, Favorite, Report, ListingImage


""" HELPER FUNCTIONS """

# Groups by a specific field and calculates count for each item (GROUP BY + COUNT)
def _get_counts(queryset, field_name): #(query_set, city)
    qs = queryset.values(field_name).annotate(count=models.Count("id")).order_by(field_name)
    
    # this returns a given fields distinct values and the count of each value
    # qs example output: (qs is a query set)
    #  <QuerySet [
    #     {'city': 'Ankara', 'count': 2},
    #     {'city': 'İstanbul', 'count': 3}
    # ]>

    return [{"name": item[field_name], "count": item["count"]} for item in qs if item[field_name]]
    # the qs example output above will become:
    # [{"name": "Ankara", "count": 2}, {"name": "İstanbul", "count": 3}]
    # in other words, it turns the queryset into a list of dictionaries
    # this is used for the frontend to get the options for the dropdown filters
    # and the counts for each option


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
def filter_cars(**filters):
    qs = CarListing.objects.select_related("listing_owner").all()

    if filters.get("brand"):
        qs = qs.filter(brand__exact=filters["brand"])

    if filters.get("transmission_type"):
        qs = qs.filter(transmission_type=filters["transmission_type"])

    if filters.get("price_min"):
        qs = qs.filter(price__gte=filters["price_min"])

    if filters.get("price_max"):
        qs = qs.filter(price__lte=filters["price_max"])

    if filters.get("city"):
        qs = qs.filter(city__iexact=filters["city"])

    if filters.get("district"):
        qs = qs.filter(district__iexact=filters["district"])

    return qs


# House listing search & filter
def filter_houses(**filters):
    qs = HouseListing.objects.select_related("listing_owner").all()

    if filters.get("meter_squared"):
        qs = qs.filter(meter_squared__gte=filters["meter_squared"])

    if filters.get("number_of_rooms"):
        qs = qs.filter(number_of_rooms=filters["number_of_rooms"])

    if filters.get("building_aged"):
        qs = qs.filter(building_aged=filters["building_aged"])

    if filters.get("floor"):
        qs = qs.filter(floor=filters["floor"])

    if filters.get("price_min"):
        qs = qs.filter(price__gte=filters["price_min"])

    if filters.get("price_max"):
        qs = qs.filter(price__lte=filters["price_max"])

    if filters.get("city"):
        qs = qs.filter(city__iexact=filters["city"])

    if filters.get("district"):
        qs = qs.filter(district__iexact=filters["district"])

    return qs



""" DYNAMIC DROPDOWN FILTER OPTIONS (Top-to Bottom) """

# Car dropdown options: City -> District & Brand -> Transmission
def get_car_filter_options(selected_city=None, selected_brand=None, selected_transmission=None):
    # this parameters are coming from request.query.params from the view functions
    base_qs = CarListing.objects.all()
    
    # 1. Cities are always populated from the entire pool
    cities = _get_counts(base_qs, "city")

    # 2. If a city is selected, narrow the pool down to that city for districts and brands
    districts = []
    qs = base_qs
    if selected_city:
        qs = qs.filter(city__iexact=selected_city)
        districts = _get_counts(qs, "district")

    brands = _get_counts(qs, "brand")

    # 3. If a brand is also selected, narrow further down for transmissions
    if selected_brand:
        qs = qs.filter(brand__exact=selected_brand)

    transmissions = _get_counts(qs, "transmission_type")

    return {
        "cities": cities,
        "districts": districts,
        "brands": brands,
        "transmissions": transmissions,
        }
         #this return will look like this, it will get narrow down 

        #     {
        #   "cities": [
        #     { "name": "Ankara", "count": 12 },
        #     { "name": "İstanbul", "count": 45 },
        #     { "name": "İzmir", "count": 20 }
        #   ],
        #   "districts": [
        #     { "name": "Beşiktaş", "count": 18 },
        #     { "name": "Kadıköy", "count": 27 }
        #   ],
        #   "brands": [
        #     { "name": "Audi", "count": 10 },
        #     { "name": "BMW", "count": 25 },
        #     { "name": "Renault", "count": 10 }
        #   ],
        #   "transmissions": [
        #     { "name": "Otomatik", "count": 22 },
        #     { "name": "Manuel", "count": 3 }
        #   ]
        # }


   

# House dropdown options: City -> District & Room Numbers -> Floors
def get_house_filter_options(selected_city=None, selected_number_of_rooms=None, selected_floor=None):
    base_qs = HouseListing.objects.all()

    # 1. Cities are always populated from the entire pool
    cities = _get_counts(base_qs, "city")

    # 2. If a city is selected, narrow the pool down for districts and room counts
    districts = []
    qs = base_qs
    if selected_city:
        qs = qs.filter(city__iexact=selected_city)
        districts = _get_counts(qs, "district")

    number_of_rooms = _get_counts(qs, "number_of_rooms")

    # 3. If room count is also selected, narrow down for floors
    if selected_number_of_rooms:
        qs = qs.filter(number_of_rooms=selected_number_of_rooms)

    floors = _get_counts(qs, "floor")

    return {
        "cities": cities,
        "districts": districts,
        "number_of_rooms": number_of_rooms,
        "floors": floors,
    }



""" LISTING CRUD OPERATIONS """

# Create a new listing
def create_listing(model_class, user, data):
    return model_class.objects.create(listing_owner=user, **data)


# Delete a listing (only owner is authorized)
def delete_listing(user, pk):
    listing = get_object_or_404(Listing, pk=pk)
    if listing.listing_owner != user:
        raise PermissionDenied("You can only delete your own listing.")
    listing.delete()


# Update a listing with partial update support
def update_listing(instance, serializer_class, data, partial=True):
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
    favorite, created = Favorite.objects.get_or_create(user=user, listing=listing)

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
