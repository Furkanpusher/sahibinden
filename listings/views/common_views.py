from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from listings.serializers import FavoriteSerializer, ReportSerializer, ListingImageSerializer
from ..services import (toggle_favorite, get_user_favorites,
                        report_listing, get_user_reports,
                        add_images_to_listing,
                        )   
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from listings.models import Listing


# FAVORİTE VİEWS

class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated] # logged in olmalı

    def post(self, request, pk):
        is_favorited = toggle_favorite(user=request.user, pk=pk) # true false döndürür
        return Response({
            "is_favorited": is_favorited,
            "detail": "Favorilere eklendi." if is_favorited else "Favorilerden çıkarıldı."
        }, status=status.HTTP_200_OK)


# 3. Giriş Yapan Kullanıcı kendi favorilerini görebilmeli
class UserFavoritesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = get_user_favorites(user=request.user)
        serializer = FavoriteSerializer(favorites, many=True) # user dönmemeli
        return Response(serializer.data, status=status.HTTP_200_OK)



# DÖNÜŞ TİPİ
#   {
#         "id": 2, favori lsit id
#         "listing": {
#             "id": 112,  list id
#             "title": "AĞIRLAR ANIL OTOMOTİV'DEN VOLKSWAGEN POLO 2014 TDI.",
#             "city": "Konya",
#             "district": "Ereğli",
#             "price": "675000.00",
#             "listing_owner": 1, owner ıd
#             "listing_date": "2025-08-21",
#             "listing_update": "2026-08-13T07:55:44.937705Z"
#         },
#         "created_at": "2026-08-17T08:30:51.056901Z",
#         "user": 10 user id
#     },

# REPORT VİEWSLARI

class ReportListingView(APIView):
    # kullanıcının kendi reportlarını görebilmesi için
    permission_classes = [IsAuthenticated] # logged in olmalı

    def post(self, request, pk):

        description = request.data.get("description", "") # "" default value

        report = report_listing(user=request.user, pk=pk, description=description)
        serializer = ReportSerializer(report) #
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
        # Sadece ilan sahibi fotoğraf yükleyebilir
        if listing.listing_owner != request.user:
            return Response({"detail": "Yalnızca kendi ilanınıza fotoğraf ekleyebilirsiniz."}, status=status.HTTP_403_FORBIDDEN)
        # 'images' anahtarıyla gelen dosyaları al (tek veya çoklu)
        files = request.FILES.getlist('images')
        if not files:
            return Response({"detail": "Hiçbir fotoğraf seçilmedi."}, status=status.HTTP_400_BAD_REQUEST)
        images = add_images_to_listing(listing, files)
        return Response(ListingImageSerializer(images, many=True).data, status=status.HTTP_201_CREATED)
