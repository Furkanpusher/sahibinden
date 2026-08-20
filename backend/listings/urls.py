from django.urls import path
from .views import (
    CarListingView, HouseListView,
    CarDetailView, HouseDetailView,
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
