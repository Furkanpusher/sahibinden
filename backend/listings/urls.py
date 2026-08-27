from django.urls import path
from .views import (
    CarListingView, HouseListView,
    CarDetailView, HouseDetailView,
    FavoriteToggleView, UserFavoritesListView,
    ReportListingView, UserReportsListView,
    StaffReportListView, StaffDeleteReportView,
    StaffDeleteListingView, ListingImageUploadView,
    NotificationView, AlarmView,
    FollowToggleView, FollowingListView,
    SellerDetailView,
)


urlpatterns = [

    # Cars
    path("cars/", CarListingView.as_view(), name="car-list"),
    path("cars/<int:pk>/", CarDetailView.as_view(), name="car-detail"),

    # Houses
    path("houses/", HouseListView.as_view(), name="house-list"),
    path("houses/<int:pk>/", HouseDetailView.as_view(), name="house-detail"),

    # Common Functions(Favorites, Reports, Images)
    path("listings/<int:pk>/favorite/",
         FavoriteToggleView.as_view(), name="toggle-favorite"),
    path("listings/<int:pk>/report/",
         ReportListingView.as_view(), name="report-listing"),
    path("listings/<int:pk>/images/",
         ListingImageUploadView.as_view(), name="upload-images"),

    # User Specific Lists
    path("favorites/", UserFavoritesListView.as_view(), name="user-favorites"),
    path("reports/", UserReportsListView.as_view(), name="user-reports"),

    # Staff Specific Lists
    path("staff/reports/", StaffReportListView.as_view(), name="staff-reports"),
    path("staff/reports/<int:pk>/", StaffDeleteReportView.as_view(),
         name="staff-delete-report"),
    path("staff/listings/<int:pk>/", StaffDeleteListingView.as_view(),
         name="staff-delete-listing"),

    # Notifications
    path("notifications/", NotificationView.as_view(), name="notifications"),

    # Alarms
    path("alarms/", AlarmView.as_view(), name="alarms"),

    # Follow
    path("sellers/<int:pk>/follow/",
         FollowToggleView.as_view(), name="toggle-follow"),

    path("following/", FollowingListView.as_view(), name="user-following"),

    # Seller
    path("sellers/<int:pk>/", SellerDetailView.as_view(), name="seller-detail"),


]
