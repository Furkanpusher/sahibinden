from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from listings.serializers import ListingSerializer, FavoriteSerializer
from ..services import get_all_listings, toggle_favorite, get_user_favorites

class MainListingView(APIView):
    permission_classes = [AllowAny]
    # Tüm ilanları göster
    def get(self, request):
        listings = get_all_listings()
        serializer = ListingSerializer(listings, many=True)
        return Response(serializer.data, status=200)

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
        serializer = FavoriteSerializer(favorites, many=True)
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