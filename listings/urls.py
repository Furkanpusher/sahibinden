from django.urls import path
from .views import (
    MainListingView, CarListingView, HouseListView, 
    CarDetailView, HouseDetailView,
    CarFilterOptionsView, HouseFilterOptionsView  # <--- Eklendi
)

print("listings/urls.py çalıştı")

urlpatterns = [
    path("", MainListingView.as_view(), name="main-listings"),
    path("all-cars/", CarListingView.as_view(), name="all-cars"),
    path("all-houses/", HouseListView.as_view(), name="all-houses"),
    path("car/<int:pk>/", CarDetailView.as_view(), name="car-detail"), # detail page
    path("house/<int:pk>/", HouseDetailView.as_view(), name="house-detail"),

    path("car-options/", CarFilterOptionsView.as_view(), name="car-options"), # dropdownlar
    path("house-options/", HouseFilterOptionsView.as_view(), name="house-options"),
    
    # addListing
    # updateListing
    # deleteListing
    # filterListing
    # reportListing
    # removeReportedListing
    # favorites
    
]