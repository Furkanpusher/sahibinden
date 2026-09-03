from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from listings.serializers import (
    FavoriteSerializer, ReportSerializer,
    ListingImageSerializer, NotificationSerializer,
    FollowedSellerWithListingsSerializer,
    SellerPublicProfileSerializer, ListingSerializer
)
from ..services import (toggle_favorite, get_user_favorites,
                        report_listing, get_user_reports,
                        add_images_to_listing, toggle_follow,
                        get_seller_by_id, get_seller_listings,
                        )
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from listings.models import Listing, Notification
from accounts.models import CustomUser
from django.db.models import Count
from .base import StandardListingPagination


# FAVORİTE VİEWS
class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        is_favorited = toggle_favorite(
            user=request.user, pk=pk)  # returns True or False
        return Response({
            "is_favorited": is_favorited,
            "detail": "Favorilere eklendi." if is_favorited else "Favorilerden çıkarıldı."
        }, status=status.HTTP_200_OK)


class UserFavoritesListView(APIView):
    # User must be logged in to see his/her favorites
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = get_user_favorites(user=request.user)
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# REPORT VİEWS
class ReportListingView(APIView):
    permission_classes = [IsAuthenticated]  # must be logged in

    def post(self, request, pk):

        description = request.data.get("description", "")  # "" default value

        report = report_listing(user=request.user, pk=pk,
                                description=description)
        serializer = ReportSerializer(report)
        return Response({
            "detail": "İlan rapor edildi.",
            "report": serializer.data
        }, status=status.HTTP_200_OK)


class UserReportsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = get_user_reports(user=request.user)
        serializer = ReportSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListingImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)
        # only listing owner can upload the images
        if listing.listing_owner != request.user:
            raise PermissionDenied(
                "Yalnızca kendi ilanınıza fotoğraf ekleyebilirsiniz.")
        files = request.FILES.getlist('images')
        if not files:
            return Response({"detail": "Hiçbir fotoğraf seçilmedi."}, status=status.HTTP_400_BAD_REQUEST)
        images = add_images_to_listing(listing, files)
        return Response(ListingImageSerializer(images, many=True).data, status=status.HTTP_201_CREATED)


class NotificationView(APIView):
    # only user can see his own notifications
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            user=request.user).select_related(
                'listing',
                'listing__houselisting',
                'listing__carlisting')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        # for read, and unread functionality
        notification_id = request.data.get("notification_id")

        if notification_id:  # for single notification
            # if only one notification is sent to be read
            updated = Notification.objects.filter(id=notification_id,
                                                  user=request.user).update(is_read=True)
            if updated == 0:
                return Response({"detail": "Bildirim bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"detail": "Bildirim okundu olarak işaretlendi."}, status=status.HTTP_200_OK)

        else:  # for all notifications(when pressed to all read)
            # mark all as read
            Notification.objects.filter(
                user=request.user, is_read=False).update(is_read=True)
            return Response({"detail": "Tüm bildirimler okundu olarak işaretlendi."}, status=status.HTTP_200_OK)

    def delete(self, request):
        # only user can delete it's own notifications
        notification_id = request.data.get("notification_id")
        notification = Notification.objects.filter(
            id=notification_id, user=request.user).first()
        if not notification:
            return Response({"detail": "Bildirim bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        notification.delete()
        return Response({"detail": "Bildirim silindi."}, status=status.HTTP_200_OK)


# FOLLOW VIEWS
class FollowToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):  # for following and unfollowing
        is_following, follower_count = toggle_follow(
            follower=request.user,
            seller_id=pk)

        return Response({
            "is_following": is_following,
            "follower_count": follower_count,
            "detail": "Satici takip edildi." if is_following else "Takipten çikarildi."
        }, status=status.HTTP_200_OK)


class FollowingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. id's of the followed sellers
        seller_ids = request.user.following.values_list("seller_id", flat=True)
        # 2. get sellers with annotated listing count
        followed_sellers = CustomUser.objects.filter(
            id__in=seller_ids
        ).annotate(
            total_listings_count=Count("ilanlar", distinct=True)
        )

        serializer = FollowedSellerWithListingsSerializer(
            followed_sellers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SellerDetailView(APIView):
    permission_classes = [AllowAny]
    pagination_class = StandardListingPagination

    def get(self, request, pk):
        seller = get_seller_by_id(pk)
        listings_qs = get_seller_listings(seller)

        seller_serializer = SellerPublicProfileSerializer(
            seller,
            context={'request': request}
        )

        # seller paginator
        paginator = self.pagination_class()
        paginated_listings = paginator.paginate_queryset(
            listings_qs, request, view=self)
        listings_serializer = ListingSerializer(
            paginated_listings, many=True, context={"request": request}
        )

        return Response({
            "seller": seller_serializer.data,
            "listings": paginator.get_paginated_response(listings_serializer.data).data
        }, status=status.HTTP_200_OK)
