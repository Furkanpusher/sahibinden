from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
# pyrefly: ignore [missing-import] sürekli uyarı veriyo gereksiz
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer


# Create your views here.

# LoginView

class LoginView(APIView):
    permission_classes = [AllowAny]  # herkes giriş yapabilsin
    authentication_classes = []  # bu endpoint'te token hiç kontrol edilmesin
    # (localStorage'da eski/geçersiz bir token varsa bile login isteği bundan etkilenmemeli)

    def post(self, request):

        print("Loginview post metodu çalıştı")
        print("Gelen veri:", request.data)

        print(request.headers.get('Content-Type'))

        username = request.data.get('username')
        password = request.data.get('password')

        print("username:", username, "password:", password)

        user = authenticate(request, username=username, password=password)
        print("authenticate sonucu:", user)

        if user is None:
            print("Kullancı bulunamadı, 401 döncek")
            return Response(
                {"hata": "Kullanıcı adı veya şifre hatalı."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        login(request, user)  # Tarayıcı oturumu (session cookie) başlatır

        refresh = RefreshToken.for_user(user)

        print("Refresh token üretildi:", refresh)

        return Response(
            {
                "access": str(refresh.access_token),
                "access_token": str(refresh.access_token),
                "refresh": str(refresh),
                "refresh_token": str(refresh),
                "user_id": user.id,
                "username": user.username,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_staff": user.is_staff,
                }
            },
            status=status.HTTP_200_OK
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]  # herkes kayıt olabilsin
    authentication_classes = []  # burada da aynı sebeple token kontrolü kapalı

    def post(self, request):
        print("RegisterView post metodu çalıştı")
        print("Gelen ham veri:", request.data)

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            print("validasyon çağırıldı")
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "mesaj": "Kayıt başarılı",
                    "access": str(refresh.access_token),
                    "access_token": str(refresh.access_token),
                    "refresh": str(refresh),
                    "refresh_token": str(refresh),
                    "user_id": user.id, # kişiye özel gösterebilmek için lazım
                    "username": user.username,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        
                    }
                },
                status=status.HTTP_201_CREATED
            )

        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)