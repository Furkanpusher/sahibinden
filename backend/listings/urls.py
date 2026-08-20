from django.urls import path
from .views import (
    CarListingView, HouseListView,
    CarDetailView, HouseDetailView,
    CarFilterOptionsView, HouseFilterOptionsView,
    FavoriteToggleView, UserFavoritesListView,
    ReportListingView, UserReportsListView,
    StaffReportListView, StaffDeleteReportView, StaffDeleteListingView,
    ListingImageUploadView
)


urlpatterns = [

    path("all-cars/", CarListingView.as_view(),
         name="all-cars"),  # product page
    path("all-houses/", HouseListView.as_view(), name="all-houses"),

    path("car/<int:pk>/", CarDetailView.as_view(),
         name="car-detail"),  # detail page
    path("house/<int:pk>/", HouseDetailView.as_view(), name="house-detail"),

    path("car-options/", CarFilterOptionsView.as_view(),
         name="car-options"),  # dropdowns
    path("house-options/", HouseFilterOptionsView.as_view(), name="house-options"),


    path("listing/<int:pk>/favorite/", FavoriteToggleView.as_view(),
         name="toggle-favorite"),  # favorites
    path("my-favorites/", UserFavoritesListView.as_view(), name="user-favorites"),


    path("listing/<int:pk>/report/", ReportListingView.as_view(),
         name="report-listing"),  # reports
    path("my-reports/", UserReportsListView.as_view(), name="user-reports"),

    # staff urls
    path("staff/reports/", StaffReportListView.as_view(),
         name="staff-reports"),  # staff
    path("staff/reports/<int:pk>/delete/",
         StaffDeleteReportView.as_view(), name="staff-delete-report"),
    path("staff/listings/<int:pk>/delete/",
         StaffDeleteListingView.as_view(), name="staff-delete-listing"),


    # image
    path('listing/<int:pk>/upload-images/',
         ListingImageUploadView.as_view(), name='upload-listing-images'),


]

# ENDPOINTS

# admin/
# api-auth/
# accounts/
# api/listings/ all-cars/ [name='all-cars']
# api/listings/ all-houses/ [name='all-houses']
# api/listings/ car/<int:pk>/ [name='car-detail']
# api/listings/ house/<int:pk>/ [name='house-detail']
# api/listings/ car-options/ [name='car-options']
# api/listings/ house-options/ [name='house-options']
# api/listings/ listing/<int:pk>/favorite/ [name='toggle-favorite']
# api/listings/ my-favorites/ [name='user-favorites']
# api/listings/ listing/<int:pk>/report/ [name='report-listing']
# api/listings/ my-reports/ [name='user-reports']
# api/listings/ staff/reports/ [name='staff-reports']
# api/listings/ staff/reports/<int:pk>/delete/ [name='staff-delete-report']
# api/listings/ staff/listings/<int:pk>/delete/ [name='staff-delete-listing']
