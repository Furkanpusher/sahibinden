from django.urls import path
from .views import MainListingView, CarListingView, HouseListView

urlpatterns = [
    path("", MainListingView.as_view(), name="main-listings"),
    path("all-cars/", CarListingView.as_view(), name="all-cars"),
    path("all-houses/", HouseListView.as_view(), name="all-houses"),
]