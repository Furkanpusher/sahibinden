from django.shortcuts import render, redirect
from django.views import View # view base classı üzerinden gidicez
from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer
 

# Create your views here.

# LoginView

class LoginView(APIView):
    permission_classes = [AllowAny]  # herkes giriş yapabilsin

    def post(self, request):

        print("Loginview post metodu çalıştı")
        print("Gelen veri:", request.data)

        # print("remote_Addr: ", request.META.get('REMOTE_ADDR'))
        # bu tarz request.META ile falan çok fazla metadataya ulaşabiliyorum
        print(request.headers.get('Content-Type')) # mesela buraya application/json olarak geldiğini görüyorum


        # requst.data dediğimiz an DRF'in JSONParser çalışır
        username = request.data.get('username')
        password = request.data.get('password')

        print("username:", username, "password:", password)

        user = authenticate(request, username=username, password=password) # doğrula
        print("authenticate sonucu:", user)

        if user is None: # kullancı veritabanında yok ise
            print("Kullancı bulunamadı, 401 döncek")
            return Response(
                {"hata": "Kullanıcı adı veya şifre hatalı."},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        refresh = RefreshToken.for_user(user) # var ise refresh token üret çünkü yeni giriş yapıyor

        print("Refresh token üretildi:", refresh)

        return Response(
            {
                "access": str(refresh.access_token),    # tokenlara yaz
                "refresh": str(refresh),
            },
            status = status.HTTP_200_OK
        )


class RegisterView(APIView):
    permission_classes = [AllowAny] # herkes kayıt olabilsin

    def post(self, request):
        print("RegisterView post metodu çalıştı")
        print("Gelen ham veri:", request.data)


        serializer = RegisterSerializer(data=request.data) # serializer ile veriyi doğrula

        if serializer.is_valid(): # serializerden gelen veri okeyse
            print("validasyon çağırıldı")
            serializer.save() # veriyi kaydet

            return Response(
                {"mesaj": "Kayıt başarılı"},
                status=status.HTTP_201_CREATED
                )

        else: # serializerden gelen veri okey değilse
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
