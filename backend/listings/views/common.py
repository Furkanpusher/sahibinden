from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from listings.serializers import FavoriteSerializer, ReportSerializer, ListingImageSerializer, NotificationSerializer
from ..services import (toggle_favorite, get_user_favorites,
                        report_listing, get_user_reports,
                        add_images_to_listing,
                        )
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from listings.models import Listing, Notification


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
            return Response({"detail": "Yalnızca kendi ilanınıza fotoğraf ekleyebilirsiniz."}, status=status.HTTP_403_FORBIDDEN)
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
            user=request.user).select_related('listing')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        # mark notification as read
        notification = Notification.objects.filter(user=request.user)
        notification.update(is_read=True)
        return Response({"detail": "Tüm bildirimler okundu olarak işaretlendi."}, status=status.HTTP_200_OK)
